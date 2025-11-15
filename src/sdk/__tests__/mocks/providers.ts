/**
 * Mock EMR provider configurations for testing
 */

import type { EMRProviderConfig } from '../../types'

export const mockEpicProvider: EMRProviderConfig = {
  id: 'epic-test',
  name: 'Epic Test',
  authUrl: 'https://test-epic.com/oauth/authorize',
  tokenUrl: 'https://test-epic.com/oauth/token',
  fhirBaseUrl: 'https://test-epic.com/fhir/r4',
  clientId: 'test-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['openid', 'fhirUser', 'patient/*.read'],
  oauth: {
    flow: 'authorization_code',
    pkce: true,
    responseType: 'code',
  },
  capabilities: {
    supportedResources: ['Patient', 'Observation', 'MedicationRequest'],
    supportsRefreshToken: true,
  },
  quirks: {
    acceptHeader: 'application/fhir+json',
    patientIdLocation: 'token.patient',
    filterByResourceType: true,
    supportsPagination: true,
    tokenParsingStrategy: 'standard',
  },
}

export const mockCernerProvider: EMRProviderConfig = {
  id: 'cerner-test',
  name: 'Cerner Test',
  authUrl: 'https://test-cerner.com/oauth/authorize',
  tokenUrl: 'https://test-cerner.com/oauth/token',
  fhirBaseUrl: 'https://test-cerner.com/fhir/r4',
  clientId: 'test-cerner-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['patient/Patient.read', 'openid', 'profile'],
  oauth: {
    flow: 'authorization_code',
    pkce: false,
    responseType: 'code',
  },
  capabilities: {
    supportedResources: ['Patient', 'Observation'],
    supportsRefreshToken: true,
  },
  quirks: {
    acceptHeader: 'application/json',
    patientIdLocation: 'token.patient',
    tokenParsingStrategy: 'standard',
  },
}
