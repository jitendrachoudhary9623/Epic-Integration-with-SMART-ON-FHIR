/**
 * EMR Configurations - Your App's Configuration
 *
 * Define ALL EMR settings here. SDK will just use what you pass.
 * SDK has ZERO hardcoded configs - it's a pure engine.
 *
 * PRODUCTION: Replace this with API call to fetch from database
 */

import type { EMRProviderConfig } from '@/sdk';

/**
 * Your EMR Configurations
 * Modify these or fetch from API/database
 */
export const EMR_CONFIGS: EMRProviderConfig[] = [
  // Epic
  {
    id: 'epic',
    name: 'Epic Systems',
    authUrl: process.env.NEXT_PUBLIC_SMART_AUTH_URL!,
    tokenUrl: process.env.NEXT_PUBLIC_SMART_TOKEN_URL!,
    fhirBaseUrl: process.env.NEXT_PUBLIC_FHIR_BASE_URL!,
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scopes: ['openid', 'fhirUser'],
    oauth: {
      flow: 'authorization_code',
      pkce: true,
      responseType: 'code',
    },
    capabilities: {
      supportedResources: ['Patient', 'Observation', 'MedicationRequest', 'Appointment', 'Encounter', 'Procedure'],
      supportsRefreshToken: true,
    },
    quirks: {
      acceptHeader: 'application/fhir+json',
      patientIdLocation: 'token.patient',
      filterByResourceType: true,
      supportsPagination: true,
      tokenParsingStrategy: 'standard',
    },
  },

  // Cerner
  {
    id: 'cerner',
    name: 'Cerner (Oracle Health)',
    authUrl: `https://authorization.cerner.com/tenants/${process.env.NEXT_PUBLIC_CERNER_TENANT_ID}/protocols/oauth2/profiles/smart-v1/personas/patient/authorize`,
    tokenUrl: `https://authorization.cerner.com/tenants/${process.env.NEXT_PUBLIC_CERNER_TENANT_ID}/hosts/fhir-myrecord.cerner.com/protocols/oauth2/profiles/smart-v1/token`,
    fhirBaseUrl: `https://fhir-myrecord.cerner.com/r4/${process.env.NEXT_PUBLIC_CERNER_TENANT_ID}`,
    clientId: process.env.NEXT_PUBLIC_CERNER_CLIENT_ID!,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scopes: [
      'patient/Patient.read',
      'patient/MedicationRequest.read',
      'patient/Observation.read',
      'patient/Appointment.read',
      'patient/Encounter.read',
      'patient/Procedure.read',
      'online_access',
      'openid',
      'profile',
      'launch/patient',
    ],
    oauth: {
      flow: 'authorization_code',
      pkce: false,
      responseType: 'code',
    },
    capabilities: {
      supportedResources: ['Patient', 'Observation', 'MedicationRequest', 'Appointment', 'Encounter', 'Procedure'],
      supportsRefreshToken: true,
    },
    quirks: {
      acceptHeader: 'application/json',
      patientIdLocation: 'token.patient',
      filterByResourceType: true,
      supportsPagination: true,
      tokenParsingStrategy: 'standard',
    },
  },

  // Athena Health
  {
    id: 'athena',
    name: 'Athena Health',
    authUrl: process.env.NEXT_PUBLIC_ATHENA_AUTH_URL!,
    tokenUrl: process.env.NEXT_PUBLIC_ATHENA_TOKEN_URL!,
    fhirBaseUrl: process.env.NEXT_PUBLIC_ATHENA_FHIR_BASE_URL!,
    clientId: process.env.NEXT_PUBLIC_ATHENA_CLIENT_ID!,
    redirectUri: process.env.NEXT_PUBLIC_ATHENA_REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scopes: [
      'patient/Patient.read',
      'patient/AllergyIntolerance.read',
      'patient/CarePlan.read',
      'patient/CareTeam.read',
      'patient/Condition.read',
      'patient/Device.read',
      'patient/DiagnosticReport.read',
      'patient/DocumentReference.read',
      'patient/Encounter.read',
      'patient/Goal.read',
      'patient/Immunization.read',
      'patient/MedicationRequest.read',
      'patient/Observation.read',
      'patient/Procedure.read',
      'patient/Provenance.read',
      'openid',
      'fhirUser',
      'launch/patient',
      'offline_access',
    ],
    oauth: {
      flow: 'authorization_code',
      pkce: true,
      responseType: 'code',
    },
    capabilities: {
      supportedResources: ['Patient', 'Observation', 'MedicationRequest', 'Appointment', 'Encounter', 'Procedure'],
      supportsRefreshToken: true,
    },
    quirks: {
      acceptHeader: 'application/fhir+json',
      patientIdLocation: 'id_token.fhirUser',
      notFoundStatusCodes: [403],
      filterByResourceType: true,
      supportsPagination: true,
      tokenParsingStrategy: 'jwt',
    },
  },

  // Allscripts
  {
    id: 'allscripts',
    name: 'Allscripts',
    authUrl: process.env.NEXT_PUBLIC_ALLSCRIPTS_AUTH_URL!,
    tokenUrl: process.env.NEXT_PUBLIC_ALLSCRIPTS_TOKEN_URL!,
    fhirBaseUrl: process.env.NEXT_PUBLIC_ALLSCRIPTS_FHIR_BASE_URL!,
    clientId: process.env.NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID!,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scopes: [
      'patient/Patient.read',
      'patient/MedicationRequest.read',
      'patient/Observation.read',
      'patient/Appointment.read',
      'patient/Encounter.read',
      'patient/Procedure.read',
      'launch/patient',
      'online_access',
    ],
    oauth: {
      flow: 'authorization_code',
      pkce: false,
      responseType: 'code',
    },
    capabilities: {
      supportedResources: ['Patient', 'Observation', 'MedicationRequest', 'Appointment', 'Encounter', 'Procedure'],
      supportsRefreshToken: false,
    },
    quirks: {
      acceptHeader: 'application/fhir+json',
      patientIdLocation: 'token.patient',
      filterByResourceType: true,
      supportsPagination: false,
      tokenParsingStrategy: 'standard',
    },
  },

  // NextGen Healthcare
  {
    id: 'nextgen',
    name: 'NextGen Healthcare',
    authUrl: process.env.NEXT_PUBLIC_NEXTGEN_AUTH_URL!,
    tokenUrl: process.env.NEXT_PUBLIC_NEXTGEN_TOKEN_URL!,
    fhirBaseUrl: process.env.NEXT_PUBLIC_NEXTGEN_FHIR_BASE_URL!,
    clientId: process.env.NEXT_PUBLIC_NEXTGEN_CLIENT_ID!,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scopes: [
      'patient/Patient.read',
      'patient/MedicationRequest.read',
      'patient/Observation.read',
      'patient/Appointment.read',
      'patient/Encounter.read',
      'patient/Procedure.read',
      'patient/AllergyIntolerance.read',
      'patient/Condition.read',
      'patient/Immunization.read',
      'launch/patient',
      'offline_access',
      'openid',
      'profile',
    ],
    oauth: {
      flow: 'authorization_code',
      pkce: true,
      responseType: 'code',
    },
    capabilities: {
      supportedResources: ['Patient', 'Observation', 'MedicationRequest', 'Appointment', 'Encounter', 'Procedure'],
      supportsRefreshToken: true,
    },
    quirks: {
      acceptHeader: 'application/fhir+json',
      patientIdLocation: 'token.patient',
      filterByResourceType: true,
      supportsPagination: true,
      tokenParsingStrategy: 'standard',
    },
  },
];

/**
 * Filter to only configured EMRs (with valid credentials)
 */
export function getConfiguredEMRs(): EMRProviderConfig[] {
  return EMR_CONFIGS.filter(config =>
    config.clientId &&
    config.authUrl &&
    config.tokenUrl &&
    config.fhirBaseUrl
  );
}
