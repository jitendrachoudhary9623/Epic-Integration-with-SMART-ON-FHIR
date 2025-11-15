import { useCallback, useState, useRef, useEffect } from 'react';

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '7aada79d-32b6-4394-bd8c-d3acf38e3a88';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000';
const ATHENA_REDIRECT_URI = process.env.NEXT_PUBLIC_ATHENA_REDIRECT_URI || REDIRECT_URI;
const EPIC_TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_EPIC_TOKEN_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';
const CERNER_TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_CERNER_TOKEN_URL || 'https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/hosts/fhir-myrecord.cerner.com/protocols/oauth2/profiles/smart-v1/token';
const CERNER_CLIENT_ID = process.env.NEXT_PUBLIC_CERNER_CLIENT_ID || "127eeefe-be03-4c9a-b93a-11c3643e82d4";
const ALLSCRIPTS_TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_ALLSCRIPTS_TOKEN_URL || '';
const ALLSCRIPTS_CLIENT_ID = process.env.NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID || "237e3cb2-3760-4025-ba1b-309bc3ddf199";
const ATHENA_TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_ATHENA_TOKEN_URL || 'https://api.preview.platform.athenahealth.com/oauth2/v1/token';
const ATHENA_CLIENT_ID = process.env.NEXT_PUBLIC_ATHENA_CLIENT_ID || "0oatemfz4jQVLtuJq297";
const NEXTGEN_TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_NEXTGEN_TOKEN_URL || 'https://fhir.nextgen.com/nge/prod/patient-oauth/token';
const NEXTGEN_CLIENT_ID = process.env.NEXT_PUBLIC_NEXTGEN_CLIENT_ID || '';
const NEXTGEN_CLIENT_SECRET = process.env.NEXT_PUBLIC_NEXTGEN_CLIENT_SECRET || '';



type EMRConfig = {
  tokenEndpoint: string;
  clientId: string;
  usesPKCE: boolean;
  redirectUri?: string;
  clientSecret?: string;
};

const emrConfigs: Record<string, EMRConfig> = {
  "1": { // Epic
    tokenEndpoint: EPIC_TOKEN_ENDPOINT,
    clientId: CLIENT_ID,
    usesPKCE: true,
  },
  "2": { // Cerner
    tokenEndpoint: CERNER_TOKEN_ENDPOINT,
    clientId: CERNER_CLIENT_ID,
    usesPKCE: false,
  },
  "3": { // Allscripts
    tokenEndpoint: ALLSCRIPTS_TOKEN_ENDPOINT,
    clientId: ALLSCRIPTS_CLIENT_ID,
    usesPKCE: false,
  },
  "5": { // Athena
    tokenEndpoint: ATHENA_TOKEN_ENDPOINT,
    clientId: ATHENA_CLIENT_ID,
    usesPKCE: true,
    redirectUri: ATHENA_REDIRECT_URI,
  },
  "6": { // NextGen
    tokenEndpoint: NEXTGEN_TOKEN_ENDPOINT,
    clientId: NEXTGEN_CLIENT_ID,
    usesPKCE: false,
    clientSecret: NEXTGEN_CLIENT_SECRET,
  },
};

export const useAuthCallback = (setStatus: (status: string) => void) => {
  const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedEMR, setSelectedEMR] = useState<string>('1');

  useEffect(() => {
    const storedEMR = localStorage.getItem('selectedEMR');
    if (storedEMR && emrConfigs[storedEMR]) {
      setSelectedEMR(storedEMR);
    }
  }, []);

  const verifyStateAndExchangeToken = useCallback(async (code: string, state: string) => {
    if (isProcessingAuth) {
      console.log('Already processing auth, skipping...');
      return;
    }

    console.log('Starting token exchange...');
    setIsProcessingAuth(true);
    setStatus('Verifying...');

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const storedState = sessionStorage.getItem('auth_state');
    if (state !== storedState) {
      setStatus('Error: Invalid state');
      setIsProcessingAuth(false);
      return;
    }

    const selectedEMR = localStorage.getItem('selectedEMR');
    const config = emrConfigs[selectedEMR || '1'];
    if (!config) {
      setStatus('Error: Invalid EMR configuration');
      setIsProcessingAuth(false);
      return;
    }

    try {
      const bodyParams: Record<string, string> = {
        grant_type: 'authorization_code',
        code: code,
        client_id: config.clientId,
        redirect_uri: config.redirectUri || REDIRECT_URI,
      };

      if (config.usesPKCE) {
        const codeVerifier = sessionStorage.getItem('code_verifier');
        if (!codeVerifier) {
          setStatus('Error: Code verifier not found');
          setIsProcessingAuth(false);
          return;
        }
        bodyParams.code_verifier = codeVerifier;
      }

      // Add client_secret for EMRs that require it (like NextGen)
      if (config.clientSecret) {
        bodyParams.client_secret = config.clientSecret;
      }

      console.log('Token exchange params:', {
        bodyParams,
        endpoint: config.tokenEndpoint,
        emr: selectedEMR
      })

      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(bodyParams),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token exchange failed:', errorData);

        if (errorData.error === 'Invalid Grant') {
          throw new Error('Authorization code expired or already used. Please try logging in again.');
        }
        throw new Error(errorData.detailedmessage || errorData.error || 'Failed to exchange code for token');
      }

      const tokens = await response.json();
      console.log('Token response:', tokens);

      // Store all tokens and metadata
      localStorage.setItem('access_token', tokens.access_token);
      if (tokens.id_token) {
        localStorage.setItem('id_token', tokens.id_token);
      }
      if (tokens.refresh_token) {
        localStorage.setItem('refresh_token', tokens.refresh_token);
      }
      if (tokens.patient) {
        localStorage.setItem('patient', tokens.patient);
        console.log('Stored patient ID from token.patient:', tokens.patient);
      } else {
        console.warn('No patient ID in token.patient field');

        // For Athena, patient context might be in a different location
        // Try to extract from id_token or other fields
        if (selectedEMR === '5' && tokens.id_token) {
          try {
            // Decode JWT to get patient info (simple base64 decode, not verification)
            const tokenParts = tokens.id_token.split('.');
            if (tokenParts.length >= 2) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('ID Token payload:', payload);

              // Check various possible locations for patient ID
              const possiblePatientId = payload.patient ||
                                       payload.sub ||
                                       payload.patientId ||
                                       payload.fhirUser?.split('/').pop();

              if (possiblePatientId) {
                localStorage.setItem('patient', possiblePatientId);
                console.log('Extracted patient ID from id_token:', possiblePatientId);
              }
            }
          } catch (e) {
            console.error('Failed to parse id_token:', e);
          }
        }
      }
      if (tokens.expires_in) {
        localStorage.setItem('expires_in', tokens.expires_in.toString());
        // Store timestamp when token was received for expiration calculation
        localStorage.setItem('token_timestamp', Date.now().toString());
      }
      if (tokens.scope) {
        localStorage.setItem('scope', tokens.scope);
      }

      sessionStorage.removeItem('auth_state');
      if (config.usesPKCE) {
        sessionStorage.removeItem('code_verifier');
      }

      setStatus('Login successful!');
      
      setTimeout(() => window.location.href = '/dashboard', 2000);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          setStatus('Authentication cancelled');
        } else {
          console.error('Token exchange error:', error);
          setStatus(`Error: ${error.message}`);
        }
      } else {
        console.error('An unknown error occurred:', error);
        setStatus('An unknown error occurred');
      }
    } finally {
      setIsProcessingAuth(false);
      abortControllerRef.current = null;
    }
  }, [setStatus, selectedEMR]);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessingAuth(false);
  }, []);

  return { verifyStateAndExchangeToken, isProcessingAuth, cleanup };
};