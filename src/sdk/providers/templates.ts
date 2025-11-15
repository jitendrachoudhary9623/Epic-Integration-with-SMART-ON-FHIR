/**
 * EMR Provider Templates
 * Base configurations without hardcoded credentials
 * Frontend passes clientId, redirectUri, and custom params
 */

import type { EMRProviderConfig } from '../types';

/**
 * Create a provider config with dynamic values
 */
export function createProviderConfig(
  template: Omit<EMRProviderConfig, 'clientId' | 'redirectUri'>,
  options: {
    clientId: string;
    redirectUri: string;
    urlParams?: Record<string, string>;
  }
): EMRProviderConfig {
  const config: EMRProviderConfig = {
    ...template,
    clientId: options.clientId,
    redirectUri: options.redirectUri,
  };

  // Merge URL params if provided
  if (options.urlParams && template.quirks?.urlParams) {
    config.quirks = {
      ...config.quirks,
      urlParams: {
        ...template.quirks.urlParams,
        ...options.urlParams,
      },
    };
  }

  return config;
}

/**
 * Epic Systems Template
 */
export const EPIC_TEMPLATE: Omit<EMRProviderConfig, 'clientId' | 'redirectUri'> = {
  id: 'epic',
  name: 'Epic Systems',
  authUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
  tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
  fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
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
};

/**
 * Cerner (Oracle Health) Template
 */
export const CERNER_TEMPLATE: Omit<EMRProviderConfig, 'clientId' | 'redirectUri'> = {
  id: 'cerner',
  name: 'Cerner (Oracle Health)',
  authUrl: 'https://authorization.cerner.com/tenants/{TENANT_ID}/protocols/oauth2/profiles/smart-v1/personas/patient/authorize',
  tokenUrl: 'https://authorization.cerner.com/tenants/{TENANT_ID}/hosts/fhir-myrecord.cerner.com/protocols/oauth2/profiles/smart-v1/token',
  fhirBaseUrl: 'https://fhir-myrecord.cerner.com/r4/{TENANT_ID}',
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
    urlParams: {
      TENANT_ID: '', // Must be provided by frontend
    },
  },
};

/**
 * Allscripts Template
 */
export const ALLSCRIPTS_TEMPLATE: Omit<EMRProviderConfig, 'clientId' | 'redirectUri'> = {
  id: 'allscripts',
  name: 'Allscripts',
  authUrl: 'https://cloud.unitysandbox.com/oauth/authorize',
  tokenUrl: 'https://cloud.unitysandbox.com/oauth/token',
  fhirBaseUrl: 'https://cloud.unitysandbox.com/fhir',
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
};

/**
 * Athena Health Template
 */
export const ATHENA_TEMPLATE: Omit<EMRProviderConfig, 'clientId' | 'redirectUri'> = {
  id: 'athena',
  name: 'Athena Health',
  authUrl: 'https://api.preview.platform.athenahealth.com/oauth2/v1/authorize',
  tokenUrl: 'https://api.preview.platform.athenahealth.com/oauth2/v1/token',
  fhirBaseUrl: 'https://api.preview.platform.athenahealth.com/fhir/r4',
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
    requiresDateFilter: {
      Appointment: false,
    },
  },
};

/**
 * NextGen Healthcare Template
 */
export const NEXTGEN_TEMPLATE: Omit<EMRProviderConfig, 'clientId' | 'redirectUri'> = {
  id: 'nextgen',
  name: 'NextGen Healthcare',
  authUrl: 'https://api.nextgen.com/fhir/oauth2/authorize',
  tokenUrl: 'https://api.nextgen.com/fhir/oauth2/token',
  fhirBaseUrl: 'https://api.nextgen.com/fhir/api/FHIR/R4',
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
};

/**
 * Meditech Template
 */
export const MEDITECH_TEMPLATE: Omit<EMRProviderConfig, 'clientId' | 'redirectUri'> = {
  id: 'meditech',
  name: 'Meditech',
  authUrl: 'https://fhir.meditech.com/oauth2/authorize',
  tokenUrl: 'https://fhir.meditech.com/oauth2/token',
  fhirBaseUrl: 'https://fhir.meditech.com/fhir',
  scopes: [
    'patient/Patient.read',
    'patient/MedicationRequest.read',
    'patient/Observation.read',
    'patient/Appointment.read',
    'patient/Encounter.read',
    'patient/Procedure.read',
    'launch/patient',
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
};

/**
 * eClinicalWorks Template
 */
export const ECLINICALWORKS_TEMPLATE: Omit<EMRProviderConfig, 'clientId' | 'redirectUri'> = {
  id: 'eclinicalworks',
  name: 'eClinicalWorks',
  authUrl: 'https://fhir.eclinicalworks.com/oauth2/authorize',
  tokenUrl: 'https://fhir.eclinicalworks.com/oauth2/token',
  fhirBaseUrl: 'https://fhir.eclinicalworks.com/fhir',
  scopes: [
    'patient/Patient.read',
    'patient/MedicationRequest.read',
    'patient/Observation.read',
    'patient/Appointment.read',
    'patient/Encounter.read',
    'patient/Procedure.read',
    'launch/patient',
    'openid',
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
};

/**
 * All available provider templates
 */
export const PROVIDER_TEMPLATES = {
  epic: EPIC_TEMPLATE,
  cerner: CERNER_TEMPLATE,
  allscripts: ALLSCRIPTS_TEMPLATE,
  athena: ATHENA_TEMPLATE,
  nextgen: NEXTGEN_TEMPLATE,
  meditech: MEDITECH_TEMPLATE,
  eclinicalworks: ECLINICALWORKS_TEMPLATE,
};

/**
 * Get list of all supported providers
 */
export function getSupportedProviders(): Array<{id: string; name: string}> {
  return Object.values(PROVIDER_TEMPLATES).map(template => ({
    id: template.id,
    name: template.name,
  }));
}
