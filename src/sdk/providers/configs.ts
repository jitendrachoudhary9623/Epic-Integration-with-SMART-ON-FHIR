/**
 * Pre-configured EMR Provider Definitions
 *
 * ⚠️ IMPORTANT: These are EXAMPLES ONLY for reference/testing.
 *
 * In production, you should:
 * 1. Define your own configs with YOUR scopes
 * 2. Fetch configs from your database/API
 * 3. Pass them via emrRegistry.registerProvider(yourConfig)
 *
 * The SDK does NOT use these unless you explicitly import them.
 * SDK is 100% generic - it uses whatever config YOU provide.
 */

import type { EMRProviderConfig } from '../types';
import { HTTP_STATUS } from '../types/http-status';

export const EPIC_PROVIDER: EMRProviderConfig = {
  id: 'epic',
  name: 'Epic Systems',
  authUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
  tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
  fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
  clientId: process.env.NEXT_PUBLIC_EPIC_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
  scopes: ['openid', 'fhirUser'],
  oauth: {
    flow: 'authorization_code',
    pkce: true,
    responseType: 'code',
  },
  capabilities: {
    supportedResources: [
      'Patient',
      'Observation',
      'MedicationRequest',
      'Appointment',
      'Encounter',
      'Procedure',
    ],
    supportsRefreshToken: true,
  },
  quirks: {
    acceptHeader: 'application/fhir+json',
    patientIdLocation: 'token.patient',
    filterByResourceType: true,
    supportsPagination: true,
    tokenParsingStrategy: 'standard',
  },
};

export const CERNER_PROVIDER: EMRProviderConfig = {
  id: 'cerner',
  name: 'Cerner (Oracle Health)',
  authUrl: 'https://authorization.cerner.com/tenants/{TENANT_ID}/protocols/oauth2/profiles/smart-v1/personas/patient/authorize',
  tokenUrl: 'https://authorization.cerner.com/tenants/{TENANT_ID}/hosts/fhir-myrecord.cerner.com/protocols/oauth2/profiles/smart-v1/token',
  fhirBaseUrl: 'https://fhir-myrecord.cerner.com/r4/{TENANT_ID}',
  clientId: process.env.NEXT_PUBLIC_CERNER_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
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
    supportedResources: [
      'Patient',
      'Observation',
      'MedicationRequest',
      'Appointment',
      'Encounter',
      'Procedure',
    ],
    supportsRefreshToken: true,
  },
  quirks: {
    acceptHeader: 'application/json',
    patientIdLocation: 'token.patient',
    filterByResourceType: true,
    supportsPagination: true,
    tokenParsingStrategy: 'standard',
    urlParams: {
      TENANT_ID: 'ec2458f2-1e24-41c8-b71b-0e701af7583d',
    },
  },
};

export const ALLSCRIPTS_PROVIDER: EMRProviderConfig = {
  id: 'allscripts',
  name: 'Allscripts',
  authUrl: 'https://cloud.unitysandbox.com/oauth/authorize',
  tokenUrl: 'https://cloud.unitysandbox.com/oauth/token',
  fhirBaseUrl: 'https://cloud.unitysandbox.com/fhir',
  clientId: process.env.NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
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
    supportedResources: [
      'Patient',
      'Observation',
      'MedicationRequest',
      'Appointment',
      'Encounter',
      'Procedure',
    ],
    supportsRefreshToken: false,
  },
  quirks: {
    acceptHeader: 'application/fhir+json',
    patientIdLocation: 'token.patient',
    filterByResourceType: true,
    supportsPagination: false,
    tokenParsingStrategy: 'standard',
  },
};

export const ATHENA_PROVIDER: EMRProviderConfig = {
  id: 'athena',
  name: 'Athena Health',
  authUrl: 'https://api.preview.platform.athenahealth.com/oauth2/v1/authorize',
  tokenUrl: 'https://api.preview.platform.athenahealth.com/oauth2/v1/token',
  fhirBaseUrl: 'https://api.preview.platform.athenahealth.com/fhir/r4',
  clientId: process.env.NEXT_PUBLIC_ATHENA_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
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
    supportedResources: [
      'Patient',
      'Observation',
      'MedicationRequest',
      'Appointment',
      'Encounter',
      'Procedure',
    ],
    supportsRefreshToken: true,
  },
  quirks: {
    acceptHeader: 'application/fhir+json',
    patientIdLocation: 'id_token.fhirUser',
    notFoundStatusCodes: [HTTP_STATUS.FORBIDDEN],
    filterByResourceType: true,
    supportsPagination: true,
    tokenParsingStrategy: 'jwt',
    requiresDateFilter: {
      Appointment: false,
    },
  },
};

/**
 * Default provider configurations
 */
export const DEFAULT_PROVIDERS: EMRProviderConfig[] = [
  EPIC_PROVIDER,
  CERNER_PROVIDER,
  ALLSCRIPTS_PROVIDER,
  ATHENA_PROVIDER,
];
