/**
 * EMR Provider Configuration Types
 */

export interface EMRProviderConfig {
  id: string;
  name: string;
  authUrl: string;
  tokenUrl: string;
  fhirBaseUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  oauth: {
    flow: 'authorization_code' | 'client_credentials';
    pkce: boolean;
    responseType?: string;
  };
  capabilities?: {
    supportedResources?: string[];
    supportsRefreshToken?: boolean;
    searchParams?: Record<string, string[]>;
  };
  quirks?: EMRQuirks;
}

export interface EMRQuirks {
  // Custom headers required by EMR
  customHeaders?: Record<string, string>;

  // Where to find patient ID (e.g., "token.patient", "id_token.fhirUser", "id_token.patient")
  patientIdLocation?: string;

  // Whether EMR requires date filters for certain resources
  requiresDateFilter?: Record<string, boolean>;

  // Custom Accept header
  acceptHeader?: string;

  // Whether to use _count parameter for pagination
  supportsPagination?: boolean;

  // Custom error codes that should be treated as "not found" instead of errors
  notFoundStatusCodes?: number[];

  // Whether to filter by resource type after fetching (some EMRs return mixed results)
  filterByResourceType?: boolean;

  // Custom token parsing logic identifier
  tokenParsingStrategy?: 'standard' | 'jwt' | 'custom';

  // URL parameter templates (e.g., Cerner's {TENANT_ID})
  urlParams?: Record<string, string>;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  patient?: string;
  scope?: string;
}

export interface AuthorizationParams {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  aud: string;
  code_challenge?: string;
  code_challenge_method?: string;
  [key: string]: string | undefined;
}

export interface PKCEChallenge {
  code_verifier: string;
  code_challenge: string;
}

export interface StoredAuthState {
  state: string;
  code_verifier?: string;
  emr_id: string;
  timestamp: number;
}
