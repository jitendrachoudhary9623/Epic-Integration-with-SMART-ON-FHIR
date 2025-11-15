# FHIR SDK for SMART on FHIR Integration

A comprehensive, type-safe SDK for integrating with multiple EMR (Electronic Medical Record) systems using SMART on FHIR standards. This SDK abstracts away the complexity of OAuth 2.0 authentication, PKCE flows, and EMR-specific quirks, providing a clean, unified API.

## Features

- **Multi-EMR Support**: Pre-configured for Epic, Cerner, Athena Health, and Allscripts
- **SMART on FHIR Compliant**: Full OAuth 2.0 with PKCE support
- **Type-Safe**: Complete TypeScript definitions for FHIR R4 resources
- **Provider-Agnostic**: Easily switch between EMRs with minimal code changes
- **React Hooks**: First-class React support with custom hooks
- **Automatic Token Refresh**: Handles token expiration automatically
- **Error Handling**: Graceful error handling with EMR-specific quirks
- **Extensible**: Easy to add new EMR providers via configuration

## Installation

```bash
# The SDK is part of this project
import { useFHIR, emrRegistry, DEFAULT_PROVIDERS } from '@/sdk';
```

## Quick Start

### 1. Initialize EMR Providers

```typescript
import { emrRegistry, DEFAULT_PROVIDERS } from '@/sdk';

// Register default providers (Epic, Cerner, Athena, Allscripts)
emrRegistry.registerProviders(DEFAULT_PROVIDERS);
```

### 2. Using React Hooks (Recommended)

```tsx
'use client';

import { useFHIR } from '@/sdk';

export default function PatientDashboard() {
  const {
    // Authentication
    isAuthenticated,
    isAuthLoading,
    login,
    logout,

    // Patient data
    patient,
    medications,
    vitals,
    labReports,
    appointments,

    // Loading and errors
    isDataLoading,
    errors,
    refetch,
  } = useFHIR('epic'); // or 'cerner', 'athena', 'allscripts'

  if (isAuthLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <button onClick={login}>Login with Epic</button>;
  }

  if (isDataLoading) return <div>Loading patient data...</div>;

  return (
    <div>
      <h1>{patient?.name?.[0]?.given?.[0]} {patient?.name?.[0]?.family}</h1>
      <button onClick={logout}>Logout</button>
      <button onClick={refetch}>Refresh Data</button>

      <h2>Medications ({medications.length})</h2>
      {medications.map(med => (
        <div key={med.id}>
          {med.medicationCodeableConcept?.text}
        </div>
      ))}

      <h2>Vitals ({vitals.length})</h2>
      {vitals.map(vital => (
        <div key={vital.id}>
          {vital.code.text}: {vital.valueQuantity?.value} {vital.valueQuantity?.unit}
        </div>
      ))}
    </div>
  );
}
```

### 3. Handling OAuth Callback

```tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/sdk';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const { handleCallback } = useAuth('epic');
  const router = useRouter();

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleCallback(window.location.href);
        router.push('/dashboard');
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/login');
      }
    };

    processCallback();
  }, [handleCallback, router]);

  return <div>Processing login...</div>;
}
```

## Advanced Usage

### Using SDK Classes Directly

```typescript
import { SMARTAuthClient, FHIRClient, PatientService } from '@/sdk';

// 1. Initialize auth client
const authClient = new SMARTAuthClient('epic');

// 2. Initiate login
const authUrl = await authClient.authorize();
window.location.href = authUrl;

// 3. Handle callback (on redirect page)
const tokenResponse = await authClient.handleCallback(window.location.href);

// 4. Create FHIR client
const fhirClient = new FHIRClient({
  providerId: 'epic',
  authClient: authClient,
  autoRefreshToken: true,
});

// 5. Use patient service
const patientService = new PatientService(fhirClient);
const medications = await patientService.getMedications('patient-id');
```

### Direct FHIR Client Usage

```typescript
import { FHIRClient } from '@/sdk';

const fhirClient = new FHIRClient({ providerId: 'epic', authClient });

// Read a specific resource
const patient = await fhirClient.read('Patient', 'patient-id');

// Search for resources
const medications = await fhirClient.search('MedicationRequest', {
  patient: 'patient-id',
  status: 'active',
});

// Search by patient
const vitals = await fhirClient.searchByPatient('Observation', 'patient-id', {
  category: 'vital-signs',
  _sort: '-date',
});
```

### Adding Request/Response Interceptors

```typescript
// Add custom headers to all requests
fhirClient.addRequestInterceptor(async (url, options) => {
  return {
    url,
    options: {
      ...options,
      headers: {
        ...options.headers,
        'X-Custom-Header': 'value',
      },
    },
  };
});

// Transform all responses
fhirClient.addResponseInterceptor(async (response, data) => {
  console.log('Response received:', data);
  return data;
});
```

### Adding Custom EMR Provider

```typescript
import { emrRegistry } from '@/sdk';

emrRegistry.registerProvider({
  id: 'custom-emr',
  name: 'Custom EMR',
  authUrl: 'https://custom-emr.com/oauth/authorize',
  tokenUrl: 'https://custom-emr.com/oauth/token',
  fhirBaseUrl: 'https://custom-emr.com/fhir/r4',
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['patient/*.read', 'openid'],
  oauth: {
    flow: 'authorization_code',
    pkce: true,
  },
  quirks: {
    acceptHeader: 'application/fhir+json',
    patientIdLocation: 'token.patient',
    filterByResourceType: true,
  },
});
```

## API Reference

### Hooks

#### `useFHIR(providerId: string)`

All-in-one hook that combines authentication, FHIR client, and data fetching.

**Returns:**
- `isAuthenticated`: boolean
- `isAuthLoading`: boolean
- `patientId`: string | null
- `login()`: Initiates OAuth flow
- `handleCallback(url)`: Processes OAuth callback
- `logout()`: Clears session
- `fhirClient`: FHIRClient instance
- `patientService`: PatientService instance
- `patient`: Patient resource
- `medications`: MedicationRequest[]
- `vitals`: Observation[]
- `labReports`: Observation[]
- `appointments`: Appointment[]
- `encounters`: Encounter[]
- `procedures`: Procedure[]
- `isDataLoading`: boolean
- `errors`: Record<string, string>
- `refetch()`: Refetch all data

#### `useAuth(providerId: string)`

Authentication-only hook.

#### `useFHIRClient(providerId, authClient)`

Creates a FHIR client instance.

#### `usePatientService(fhirClient)`

Creates a patient service instance.

### Classes

#### `SMARTAuthClient`

Handles SMART on FHIR authentication.

```typescript
const authClient = new SMARTAuthClient(providerId, options?);

// Methods
await authClient.authorize();
await authClient.handleCallback(url);
await authClient.getAccessToken();
await authClient.refreshAccessToken();
await authClient.isAuthenticated();
await authClient.getPatientId();
await authClient.logout();
```

#### `FHIRClient`

FHIR API client with interceptor support.

```typescript
const fhirClient = new FHIRClient({ providerId, authClient });

// Methods
await fhirClient.read<T>(resourceType, id);
await fhirClient.search<T>(resourceType, params);
await fhirClient.searchByPatient<T>(resourceType, patientId, params);
fhirClient.addRequestInterceptor(interceptor);
fhirClient.addResponseInterceptor(interceptor);
```

#### `PatientService`

High-level service for patient operations.

```typescript
const service = new PatientService(fhirClient);

// Methods
await service.getPatient(patientId);
await service.getMedications(patientId, options?);
await service.getVitals(patientId, options?);
await service.getLabReports(patientId, options?);
await service.getAppointments(patientId, options?);
await service.getEncounters(patientId, options?);
await service.getProcedures(patientId, options?);
await service.getAllPatientData(patientId);
```

#### `EMRRegistry`

Manages EMR provider configurations.

```typescript
import { emrRegistry } from '@/sdk';

emrRegistry.registerProvider(config);
emrRegistry.registerProviders(configs);
emrRegistry.getProvider(id);
emrRegistry.listProviders();
emrRegistry.hasProvider(id);
```

## Supported EMR Providers

### Epic
- **ID**: `epic`
- **PKCE**: Yes
- **Refresh Token**: Yes

### Cerner (Oracle Health)
- **ID**: `cerner`
- **PKCE**: No
- **Refresh Token**: Yes
- **Note**: Requires TENANT_ID configuration

### Athena Health
- **ID**: `athena`
- **PKCE**: Yes
- **Refresh Token**: Yes
- **Note**: Uses JWT for patient ID extraction

### Allscripts
- **ID**: `allscripts`
- **PKCE**: No
- **Refresh Token**: No

## Environment Variables

```env
# Epic
NEXT_PUBLIC_EPIC_CLIENT_ID=your-client-id

# Cerner
NEXT_PUBLIC_CERNER_CLIENT_ID=your-client-id

# Athena
NEXT_PUBLIC_ATHENA_CLIENT_ID=your-client-id

# Allscripts
NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID=your-client-id

# Common
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/callback
```

## EMR-Specific Quirks Handled

The SDK automatically handles EMR-specific behaviors:

1. **Epic**: Requires specific status filters for MedicationRequest and Appointment
2. **Cerner**: Uses `application/json` instead of `application/fhir+json`
3. **Athena**: Returns 403 for restricted resources (treated as not found)
4. **Athena**: Patient ID in JWT `id_token` claims
5. **All**: Different PKCE requirements
6. **All**: Different scopes and permissions

## Error Handling

```typescript
import { FHIRError } from '@/sdk';

try {
  const patient = await patientService.getPatient('patient-id');
} catch (error) {
  if (error instanceof FHIRError) {
    console.error('FHIR Error:', {
      message: error.message,
      statusCode: error.statusCode,
      resourceType: error.resourceType,
      providerId: error.providerId,
      operationOutcome: error.operationOutcome,
    });
  }
}
```

## Migration from Current Implementation

### Before (Current Code)

```typescript
// Multiple files with duplicated configuration
const emrConfigs = {
  "1": { /* Epic config */ },
  "2": { /* Cerner config */ },
  // ...
};

// Manual PKCE handling
const pkce = await pkceChallenge();
sessionStorage.setItem('code_verifier', pkce.code_verifier);

// Manual API calls
const response = await fetch(`${FHIR_BASE_URL}/MedicationRequest?patient=${patientId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': isCerner ? 'application/json' : 'application/fhir+json',
  },
});

// EMR-specific logic scattered everywhere
if (isAthenaEMR()) {
  // Special handling
}
```

### After (SDK)

```typescript
// Single import
import { useFHIR } from '@/sdk';

// Everything handled automatically
const { medications, isLoading } = useFHIR('epic');
```

## Benefits

1. **90% Less Boilerplate**: No more manual OAuth flows, token management, or API calls
2. **Type Safety**: Full TypeScript support with FHIR R4 types
3. **Maintainability**: EMR-specific logic centralized in one place
4. **Extensibility**: Add new EMRs via JSON configuration
5. **Testing**: Easy to mock and test
6. **Documentation**: Self-documenting with TypeScript types

## License

Part of the Epic-Integration-with-SMART-ON-FHIR project.
