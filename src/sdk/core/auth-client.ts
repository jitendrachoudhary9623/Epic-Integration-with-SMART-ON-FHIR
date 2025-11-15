/**
 * SMART on FHIR Authentication Client
 * Handles OAuth 2.0 authorization code flow with PKCE support
 */

import type {
  EMRProviderConfig,
  TokenResponse,
  AuthorizationParams,
  TokenStorage,
} from '../types';
import { emrRegistry } from '../providers';
import {
  LocalStorageTokenStorage,
  SessionStorageAuthState,
  generatePKCEChallenge,
  generateState,
  parseJWT,
} from '../utils';

export interface AuthClientOptions {
  storage?: TokenStorage;
  onTokenRefresh?: (newToken: string) => void;
}

export class SMARTAuthClient {
  private provider: EMRProviderConfig;
  private storage: TokenStorage;
  private authState: SessionStorageAuthState;
  private onTokenRefresh?: (newToken: string) => void;

  constructor(providerId: string, options: AuthClientOptions = {}) {
    this.provider = emrRegistry.getProvider(providerId);
    this.storage = options.storage || new LocalStorageTokenStorage();
    this.authState = new SessionStorageAuthState();
    this.onTokenRefresh = options.onTokenRefresh;
  }

  /**
   * Generate authorization URL and redirect user to EMR login
   */
  async authorize(): Promise<string> {
    const state = generateState();
    this.authState.setState(state);
    this.authState.setProviderId(this.provider.id);

    const params: AuthorizationParams = {
      client_id: this.provider.clientId,
      redirect_uri: this.provider.redirectUri,
      response_type: this.provider.oauth.responseType || 'code',
      scope: this.provider.scopes.join(' '),
      state,
      aud: this.provider.fhirBaseUrl,
    };

    // Add PKCE challenge if supported
    if (this.provider.oauth.pkce) {
      const pkce = await generatePKCEChallenge();
      this.authState.setCodeVerifier(pkce.code_verifier);
      params.code_challenge = pkce.code_challenge;
      params.code_challenge_method = 'S256';
    }

    const url = new URL(this.provider.authUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  /**
   * Handle callback from EMR and exchange code for tokens
   */
  async handleCallback(callbackUrl: string): Promise<TokenResponse> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`Authorization failed: ${error}`);
    }

    if (!code) {
      throw new Error('Authorization code not found in callback URL');
    }

    if (!state) {
      throw new Error('State parameter not found in callback URL');
    }

    // Verify state
    const storedState = this.authState.getState();
    if (state !== storedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // Exchange code for tokens
    const tokenResponse = await this.exchangeCode(code);

    // Store tokens
    await this.storeTokens(tokenResponse);

    // Extract and store patient ID
    const patientId = await this.extractPatientId(tokenResponse);
    if (patientId) {
      await this.storage.setPatientId(patientId);
    }

    // Clean up auth state
    this.authState.clear();

    return tokenResponse;
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCode(code: string): Promise<TokenResponse> {
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.provider.redirectUri,
      client_id: this.provider.clientId,
    };

    // Add code verifier if PKCE was used
    if (this.provider.oauth.pkce) {
      const codeVerifier = this.authState.getCodeVerifier();
      if (codeVerifier) {
        body.code_verifier = codeVerifier;
      }
    }

    console.log('🔄 Exchanging code for tokens...', {
      tokenUrl: this.provider.tokenUrl,
      clientId: this.provider.clientId,
      redirectUri: this.provider.redirectUri,
      hasPKCE: this.provider.oauth.pkce,
      hasCodeVerifier: !!body.code_verifier,
    });

    const response = await fetch(this.provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
    }

    const tokenResponse = await response.json();
    console.log('✅ Token exchange successful');
    return tokenResponse;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<TokenResponse> {
    const refreshToken = await this.storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.provider.clientId,
    });

    const response = await fetch(this.provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const tokenResponse: TokenResponse = await response.json();
    await this.storeTokens(tokenResponse);

    if (this.onTokenRefresh && tokenResponse.access_token) {
      this.onTokenRefresh(tokenResponse.access_token);
    }

    return tokenResponse;
  }

  /**
   * Get current access token, refreshing if needed
   */
  async getAccessToken(): Promise<string> {
    const token = await this.storage.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    // Check if token is expired
    if (await this.isTokenExpired()) {
      if (this.provider.capabilities?.supportsRefreshToken) {
        const newTokens = await this.refreshAccessToken();
        return newTokens.access_token;
      }
      throw new Error('Access token expired and refresh not supported');
    }

    return token;
  }

  /**
   * Check if current token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    const expiry = await this.storage.getTokenExpiry();
    if (!expiry) return false;

    const now = Date.now();
    // Add 60 second buffer to refresh before actual expiry
    return now >= expiry - 60000;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.storage.getAccessToken();
    if (!token) return false;

    const expired = await this.isTokenExpired();
    return !expired;
  }

  /**
   * Get patient ID from storage
   */
  async getPatientId(): Promise<string | null> {
    return this.storage.getPatientId();
  }

  /**
   * Logout and clear all tokens
   */
  async logout(): Promise<void> {
    await this.storage.clear();
    this.authState.clear();
  }

  /**
   * Store tokens in storage
   */
  private async storeTokens(tokenResponse: TokenResponse): Promise<void> {
    await this.storage.setAccessToken(tokenResponse.access_token);

    if (tokenResponse.refresh_token) {
      await this.storage.setRefreshToken(tokenResponse.refresh_token);
    }

    if (tokenResponse.id_token) {
      await this.storage.setIdToken(tokenResponse.id_token);
    }

    if (tokenResponse.expires_in) {
      const expiry = Date.now() + tokenResponse.expires_in * 1000;
      await this.storage.setTokenExpiry(expiry);
    }

    if (tokenResponse.patient) {
      await this.storage.setPatientId(tokenResponse.patient);
    }
  }

  /**
   * Extract patient ID based on provider quirks
   */
  private async extractPatientId(tokenResponse: TokenResponse): Promise<string | null> {
    const location = this.provider.quirks?.patientIdLocation || 'token.patient';

    if (location === 'token.patient') {
      return tokenResponse.patient || null;
    }

    if (location.startsWith('id_token.')) {
      if (!tokenResponse.id_token) return null;

      const claims = parseJWT(tokenResponse.id_token);
      if (!claims) return null;

      const claimPath = location.replace('id_token.', '');

      // Handle nested paths
      if (claimPath.includes('.')) {
        const parts = claimPath.split('.');
        let value: any = claims;
        for (const part of parts) {
          value = value?.[part];
        }
        return value || null;
      }

      // Special handling for fhirUser (extract patient ID from reference)
      if (claimPath === 'fhirUser') {
        const fhirUser = claims.fhirUser || claims.fhir_user;
        if (fhirUser) {
          const match = fhirUser.match(/Patient\/([^/]+)/);
          return match ? match[1] : null;
        }
      }

      return claims[claimPath] || null;
    }

    return null;
  }

  /**
   * Get provider configuration
   */
  getProvider(): EMRProviderConfig {
    return this.provider;
  }
}
