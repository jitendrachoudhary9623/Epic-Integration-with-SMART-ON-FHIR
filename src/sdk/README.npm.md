# @nirmitee/fhir-sdk

[![npm version](https://img.shields.io/npm/v/@nirmitee/fhir-sdk.svg)](https://www.npmjs.com/package/@nirmitee/fhir-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

Universal FHIR SDK for SMART on FHIR integrations. Framework-agnostic with first-class React support.

## ✨ Features

- 🏥 **Multi-EMR Support** - Epic, Cerner, Athena Health, Allscripts, NextGen, Meditech, eClinicalWorks
- 🔐 **SMART on FHIR Compliant** - Full OAuth 2.0 with PKCE support
- 📘 **Type-Safe** - Complete TypeScript definitions for FHIR R4 resources
- ⚛️ **Framework Agnostic** - Works with React, Vue, Angular, Svelte, or vanilla JS
- 🪝 **React Hooks** - Optional React hooks for convenience
- 🔄 **Auto Token Refresh** - Handles token expiration automatically
- 🎯 **Modular** - Use only what you need
- 🧩 **Extensible** - Easy to add custom EMR providers
- ✅ **Well Tested** - 72% code coverage with 128 tests

## 📦 Installation

```bash
npm install @nirmitee/fhir-sdk
```

**For React projects:**
```bash
npm install @nirmitee/fhir-sdk react@^18
```

## 🚀 Quick Start

### React (Easiest)

```tsx
import { useFHIR } from '@nirmitee/fhir-sdk/hooks'

function PatientDashboard() {
  const {
    // Auth
    isAuthenticated,
    login,
    logout,

    // Data (auto-fetched)
    patient,
    medications,
    vitals,
    isDataLoading,
  } = useFHIR('epic')

  if (!isAuthenticated) {
    return <button onClick={login}>Login with Epic</button>
  }

  return (
    <div>
      <h1>Welcome {patient?.name?.[0]?.given?.[0]}!</h1>
      <p>Medications: {medications.length}</p>
    </div>
  )
}
```

### Vanilla JavaScript / TypeScript

```typescript
import { SMARTAuthClient, FHIRClient } from '@nirmitee/fhir-sdk'

// 1. Authenticate
const authClient = new SMARTAuthClient('epic')
const authUrl = await authClient.authorize()
window.location.href = authUrl

// 2. Handle callback
await authClient.handleCallback(window.location.href)

// 3. Fetch FHIR data
const fhirClient = new FHIRClient({ providerId: 'epic', authClient })
const patient = await fhirClient.read('Patient', 'patient-123')
const meds = await fhirClient.search('MedicationRequest', {
  patient: 'patient-123',
  status: 'active'
})
```

### Vue.js

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { SMARTAuthClient, FHIRClient } from '@nirmitee/fhir-sdk'

const authClient = new SMARTAuthClient('epic')
const fhirClient = new FHIRClient({ providerId: 'epic', authClient })

const patient = ref(null)
const isAuthenticated = ref(false)

onMounted(async () => {
  isAuthenticated.value = await authClient.isAuthenticated()
  if (isAuthenticated.value) {
    const patientId = await authClient.getPatientId()
    patient.value = await fhirClient.read('Patient', patientId)
  }
})

const login = async () => {
  const authUrl = await authClient.authorize()
  window.location.href = authUrl
}
</script>

<template>
  <button v-if="!isAuthenticated" @click="login">Login</button>
  <div v-else>Welcome {{ patient?.name?.[0]?.given?.[0] }}!</div>
</template>
```

## 🏥 Supported EMR Providers

| Provider | ID | PKCE | Status |
|----------|-----|------|--------|
| Epic Systems | `epic` | ✅ | ✅ Tested |
| Cerner (Oracle Health) | `cerner` | ❌ | ✅ Tested |
| Athena Health | `athena` | ✅ | ✅ Tested |
| Allscripts | `allscripts` | ❌ | ✅ Tested |
| NextGen Healthcare | `nextgen` | ✅ | ⚠️ Template |
| Meditech | `meditech` | ✅ | ⚠️ Template |
| eClinicalWorks | `eclinicalworks` | ✅ | ⚠️ Template |

## 📚 Documentation

### Core Classes

#### `SMARTAuthClient`
Handles OAuth 2.0 authentication with PKCE.

```typescript
import { SMARTAuthClient } from '@nirmitee/fhir-sdk'

const authClient = new SMARTAuthClient('epic', {
  storage: customStorage,  // Optional
  onTokenRefresh: (token) => console.log('Token refreshed')
})

// Generate authorization URL
const authUrl = await authClient.authorize()

// Handle OAuth callback
await authClient.handleCallback(callbackUrl)

// Check authentication
const isAuth = await authClient.isAuthenticated()

// Get patient ID
const patientId = await authClient.getPatientId()

// Logout
await authClient.logout()
```

#### `FHIRClient`
FHIR resource operations with automatic token management.

```typescript
import { FHIRClient } from '@nirmitee/fhir-sdk'

const fhirClient = new FHIRClient({
  providerId: 'epic',
  authClient,
  autoRefreshToken: true,
  onError: (error) => console.error(error)
})

// Read a single resource
const patient = await fhirClient.read('Patient', 'patient-123')

// Search resources
const medications = await fhirClient.search('MedicationRequest', {
  patient: 'patient-123',
  status: 'active'
})

// Search by patient
const vitals = await fhirClient.searchByPatient('Observation', 'patient-123', {
  category: 'vital-signs'
})
```

#### `PatientService`
High-level service for patient data operations.

```typescript
import { PatientService } from '@nirmitee/fhir-sdk'

const patientService = new PatientService(fhirClient)

// Get patient demographics
const patient = await patientService.getPatient('patient-123')

// Get medications
const medications = await patientService.getMedications('patient-123')

// Get vitals
const vitals = await patientService.getVitals('patient-123')

// Get all data at once (parallel)
const allData = await patientService.getAllPatientData('patient-123')
```

### React Hooks

#### `useFHIR` (All-in-One)

```typescript
import { useFHIR } from '@nirmitee/fhir-sdk/hooks'

const {
  // Auth
  isAuthenticated,
  isAuthLoading,
  login,
  logout,
  handleCallback,

  // Clients
  fhirClient,
  patientService,

  // Data
  patient,
  medications,
  vitals,
  labReports,
  appointments,
  isDataLoading,
  errors,
  refetch,
} = useFHIR('epic')
```

#### Composable Hooks

```typescript
import { useAuth, useFHIRClient, usePatientService } from '@nirmitee/fhir-sdk/hooks'

// Use individually for more control
const auth = useAuth('epic')
const fhirClient = useFHIRClient('epic', auth.authClient)
const patientService = usePatientService(fhirClient)
```

## 🔧 Configuration

### Adding Custom EMR Provider

```typescript
import { emrRegistry } from '@nirmitee/fhir-sdk'

emrRegistry.registerProvider({
  id: 'my-custom-emr',
  name: 'My Custom EMR',
  authUrl: 'https://my-emr.com/oauth/authorize',
  tokenUrl: 'https://my-emr.com/oauth/token',
  fhirBaseUrl: 'https://my-emr.com/fhir/r4',
  clientId: process.env.CUSTOM_EMR_CLIENT_ID,
  redirectUri: process.env.REDIRECT_URI,
  scopes: ['patient/*.read', 'openid'],
  oauth: {
    flow: 'authorization_code',
    pkce: true,
  },
  quirks: {
    acceptHeader: 'application/fhir+json',
    patientIdLocation: 'token.patient',
  },
})

// Use immediately
const authClient = new SMARTAuthClient('my-custom-emr')
```

### Custom Storage

```typescript
import { SMARTAuthClient, TokenStorage } from '@nirmitee/fhir-sdk'

class MyCustomStorage implements TokenStorage {
  async getAccessToken(): Promise<string | null> {
    return await myDB.get('access_token')
  }

  async setAccessToken(token: string): Promise<void> {
    await myDB.set('access_token', token)
  }

  // Implement other methods...
}

const authClient = new SMARTAuthClient('epic', {
  storage: new MyCustomStorage()
})
```

### Request/Response Interceptors

```typescript
fhirClient.addRequestInterceptor((url, options) => {
  return {
    url,
    options: {
      ...options,
      headers: {
        ...options.headers,
        'X-Custom-Header': 'value',
      }
    }
  }
})

fhirClient.addResponseInterceptor((response, data) => {
  console.log('Response received:', data)
  return { ...data, _fetchedAt: new Date() }
})
```

## 🏗️ Architecture

The SDK is built with modularity in mind:

```
Layer 5: React Hooks (Optional)
  ├─ useFHIR, useAuth, usePatientData
  │
Layer 4: Services (Optional)
  ├─ PatientService (create your own)
  │
Layer 3: FHIR Client
  ├─ FHIRClient
  │
Layer 2: Auth Client
  ├─ SMARTAuthClient
  │
Layer 1: Foundation
  └─ EMR Registry, Storage, PKCE Utils
```

**Use only what you need!** The SDK is framework-agnostic at its core, with React hooks as an optional convenience layer.

## 📖 Examples

See [EXAMPLES.md](./EXAMPLES.md) for more detailed examples including:
- Multi-provider support
- Server-side usage
- Angular/Vue/Svelte integration
- Custom services
- Error handling
- And more...

## 🧪 Testing

The SDK has comprehensive test coverage:
- 128 tests
- 72% code coverage
- Unit tests for all core functionality
- Integration tests for OAuth flows

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT © Nirmitee

## 🔗 Links

- [GitHub Repository](https://github.com/nirmitee/fhir-sdk)
- [Issue Tracker](https://github.com/nirmitee/fhir-sdk/issues)
- [Modularity Guide](./MODULARITY.md)
- [Examples](./EXAMPLES.md)

## 💡 Support

For questions and support, please open an issue on GitHub.
