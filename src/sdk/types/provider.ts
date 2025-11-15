/**
 * EMR Provider Configuration Types
 *
 * ⚠️ IMPORTANT: YOU control all these values!
 * SDK uses exactly what you provide - no hardcoding.
 */

export interface EMRProviderConfig {
  /**
   * Unique identifier for this provider
   * @example 'epic', 'cerner', 'athena'
   */
  id: string;

  /**
   * Display name for UI
   * @example 'Epic Systems', 'Cerner (Oracle Health)'
   */
  name: string;

  /**
   * OAuth authorization URL (from EMR documentation)
   * @example 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize'
   */
  authUrl: string;

  /**
   * OAuth token exchange URL (from EMR documentation)
   * @example 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token'
   */
  tokenUrl: string;

  /**
   * FHIR API base URL (from EMR documentation)
   * @example 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'
   */
  fhirBaseUrl: string;

  /**
   * YOUR app's client ID (from EMR registration)
   * Get this by registering your app with the EMR
   */
  clientId: string;

  /**
   * YOUR app's OAuth callback URL
   * Must match what you registered with the EMR
   * @example 'http://localhost:3000', 'https://yourapp.com/callback'
   */
  redirectUri: string;

  /**
   * OAuth scopes - YOU DEFINE THESE!
   * SDK never hardcodes or modifies your scopes.
   * Request only what your app needs.
   *
   * Common SMART scopes:
   * - 'openid' - OpenID Connect
   * - 'fhirUser' - Get user info
   * - 'patient/*.read' - Read all patient resources
   * - 'patient/Patient.read' - Read patient demographics
   * - 'patient/Observation.read' - Read observations
   * - 'patient/MedicationRequest.read' - Read medications
   * - 'launch/patient' - Patient context at launch
   * - 'offline_access' - Get refresh token
   *
   * @example ['openid', 'fhirUser']
   * @example ['patient/Patient.read', 'patient/Observation.read', 'offline_access']
   */
  scopes: string[];

  /**
   * OAuth flow configuration
   */
  oauth: {
    /**
     * OAuth flow type
     * - 'authorization_code': Standard SMART on FHIR flow (most common)
     * - 'client_credentials': Backend/server-to-server flow
     */
    flow: 'authorization_code' | 'client_credentials';

    /**
     * Use PKCE (Proof Key for Code Exchange)?
     * - true: More secure, recommended for public clients (web/mobile apps)
     * - false: Basic auth code flow (only if EMR doesn't support PKCE)
     *
     * Epic, Athena: true
     * Cerner, Allscripts: false (as of 2025)
     */
    pkce: boolean;

    /**
     * OAuth response type (usually 'code' for auth code flow)
     * @default 'code'
     */
    responseType?: string;
  };

  /**
   * EMR capabilities (what this EMR supports)
   * Optional but recommended for better error handling
   */
  capabilities?: {
    /**
     * List of FHIR resources this EMR supports
     * Helps SDK show better error messages
     * @example ['Patient', 'Observation', 'MedicationRequest']
     */
    supportedResources?: string[];

    /**
     * Does this EMR issue refresh tokens?
     * - true: Can use refresh tokens for long sessions
     * - false: Must re-authenticate when access token expires
     */
    supportsRefreshToken?: boolean;

    /**
     * Default search parameters for resources
     * @example { 'Observation': ['category', 'date'] }
     */
    searchParams?: Record<string, string[]>;
  };

  /**
   * EMR-specific quirks and workarounds
   * Configure how SDK handles this EMR's unique behaviors
   */
  quirks?: EMRQuirks;
}

/**
 * EMR-Specific Quirks and Workarounds
 *
 * Every EMR has unique behaviors. Configure these to tell SDK
 * how to handle this EMR's specific requirements.
 */
export interface EMRQuirks {
  /**
   * Custom HTTP headers required by this EMR
   * @example { 'X-Custom-Header': 'value' }
   */
  customHeaders?: Record<string, string>;

  /**
   * Where to find patient ID after authentication
   *
   * Different EMRs put patient ID in different places:
   * - 'token.patient': In token response body (Epic, Cerner, Allscripts)
   * - 'id_token.fhirUser': In JWT id_token's fhirUser claim (Athena)
   * - 'id_token.patient': In JWT id_token's patient claim
   *
   * @example 'token.patient'
   * @example 'id_token.fhirUser'
   */
  patientIdLocation?: string;

  /**
   * Does this EMR require date filters for certain resources?
   *
   * Some EMRs require date ranges when searching resources.
   * Set false to make dates optional.
   *
   * @example { 'Appointment': false, 'Observation': true }
   */
  requiresDateFilter?: Record<string, boolean>;

  /**
   * Custom Accept header for FHIR requests
   *
   * Most EMRs use 'application/fhir+json' but some use 'application/json'
   *
   * Epic, Athena, Allscripts: 'application/fhir+json'
   * Cerner: 'application/json'
   *
   * @default 'application/fhir+json'
   */
  acceptHeader?: string;

  /**
   * Does this EMR support pagination with _count parameter?
   * @default true
   */
  supportsPagination?: boolean;

  /**
   * HTTP status codes that mean "not found" (besides 404)
   *
   * Some EMRs return non-standard status codes:
   * - Athena returns 403 for resources that don't exist
   *
   * Use HTTP_STATUS constants for readability:
   * @example [HTTP_STATUS.FORBIDDEN]
   */
  notFoundStatusCodes?: number[];

  /**
   * Filter results by resource type after fetching?
   *
   * Some EMRs return mixed resource types in search results.
   * Set true to filter client-side.
   *
   * @default false
   */
  filterByResourceType?: boolean;

  /**
   * How to parse access tokens
   *
   * - 'standard': Token is opaque string (Epic, Cerner, Allscripts)
   * - 'jwt': Token is JWT, decode to get patient ID (Athena)
   * - 'custom': Use custom parsing logic
   *
   * @default 'standard'
   */
  tokenParsingStrategy?: 'standard' | 'jwt' | 'custom';

  /**
   * URL parameter templates
   *
   * Some EMRs use placeholders in URLs (e.g., Cerner's {TENANT_ID})
   * SDK will replace these placeholders with actual values.
   *
   * @example { TENANT_ID: 'your-tenant-id' }
   */
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
