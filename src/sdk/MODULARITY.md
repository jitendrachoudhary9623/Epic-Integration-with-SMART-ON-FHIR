# SDK Modularity & Integration Guide

## Overview

The FHIR SDK is designed with **modularity** and **independence** as core principles. You can use any layer independently without being forced to use the entire stack.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│  Layer 5: React Hooks (Optional)           │  ← High-level convenience
│  - useFHIR, useAuth, usePatientData        │
├─────────────────────────────────────────────┤
│  Layer 4: Services (Optional)              │  ← Domain-specific logic
│  - PatientService, (add your own)          │
├─────────────────────────────────────────────┤
│  Layer 3: FHIR Client (Core)               │  ← FHIR operations
│  - FHIRClient                               │
├─────────────────────────────────────────────┤
│  Layer 2: Auth Client (Core)               │  ← OAuth 2.0 + PKCE
│  - SMARTAuthClient                          │
├─────────────────────────────────────────────┤
│  Layer 1: Providers & Utils (Foundation)   │  ← Configuration
│  - EMR Registry, Storage, PKCE              │
└─────────────────────────────────────────────┘
```

## Independence Principles

### ✅ Each layer is independent
- Use only the layers you need
- Skip high-level abstractions if you prefer control
- Compose layers however you want

### ✅ No framework lock-in
- React hooks are optional
- Core SDK works with Vue, Angular, Svelte, vanilla JS
- Server-side compatible (Node.js, Deno, Bun)

### ✅ Provider-agnostic
- Works with any SMART on FHIR provider
- Easy to add custom EMRs
- Not tied to Epic, Cerner, etc.

### ✅ Customizable
- Override any behavior
- Add your own services
- Use custom storage implementations

## Usage Examples

### 1. Use Everything (Easiest)

Perfect for simple React apps:

```typescript
import { useFHIR } from '@/sdk'

function MyComponent() {
  const {
    // Auth
    isAuthenticated,
    login,
    logout,

    // Data (auto-fetched)
    patient,
    medications,
    vitals,

    // Loading states
    isDataLoading,
  } = useFHIR('epic')

  if (!isAuthenticated) {
    return <button onClick={login}>Login with Epic</button>
  }

  return <div>Welcome {patient?.name?.[0]?.given?.[0]}!</div>
}
```

### 2. Use Only Core Clients (More Control)

Perfect for non-React apps or custom logic:

```typescript
import { SMARTAuthClient, FHIRClient } from '@/sdk'

// Auth
const authClient = new SMARTAuthClient('epic')
const authUrl = await authClient.authorize()
// Redirect user to authUrl...

// After callback
await authClient.handleCallback(window.location.href)

// FHIR operations
const fhirClient = new FHIRClient({ providerId: 'epic', authClient })
const patient = await fhirClient.read('Patient', 'patient-123')
const meds = await fhirClient.search('MedicationRequest', {
  patient: 'patient-123',
  status: 'active'
})
```

### 3. Use Composable Hooks (Flexible)

Pick only the hooks you need:

```typescript
import { useAuth, useFHIRClient } from '@/sdk'

function MyComponent() {
  // Just auth
  const { isAuthenticated, login, authClient, patientId } = useAuth('epic')

  // Just FHIR client
  const fhirClient = useFHIRClient('epic', authClient)

  // Custom data fetching
  const [data, setData] = useState(null)

  useEffect(() => {
    if (isAuthenticated && patientId) {
      // Your custom logic
      fhirClient.search('Condition', { patient: patientId })
        .then(setData)
    }
  }, [isAuthenticated, patientId])

  // ...
}
```

### 4. Add Your Own Service Layer

Extend with custom services:

```typescript
import { FHIRClient } from '@/sdk'

// Your custom service
class AllergyService {
  constructor(private fhirClient: FHIRClient) {}

  async getAllergies(patientId: string) {
    return this.fhirClient.searchByPatient(
      'AllergyIntolerance',
      patientId,
      { clinicalStatus: 'active' }
    )
  }

  async addAllergy(patientId: string, allergyData: any) {
    // Custom logic
  }
}

// Use it
const fhirClient = new FHIRClient({ providerId: 'epic', authClient })
const allergyService = new AllergyService(fhirClient)
const allergies = await allergyService.getAllergies('patient-123')
```

### 5. Use with Vue

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { SMARTAuthClient, FHIRClient } from '@/sdk'

const authClient = new SMARTAuthClient('epic')
const fhirClient = new FHIRClient({ providerId: 'epic', authClient })

const isAuthenticated = ref(false)
const patient = ref(null)

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
  <div>
    <button v-if="!isAuthenticated" @click="login">Login</button>
    <div v-else>Welcome {{ patient?.name?.[0]?.given?.[0] }}!</div>
  </div>
</template>
```

### 6. Use with Angular

```typescript
import { Component, OnInit } from '@angular/core'
import { SMARTAuthClient, FHIRClient } from '@/sdk'

@Component({
  selector: 'app-patient',
  template: `
    <button *ngIf="!isAuthenticated" (click)="login()">Login</button>
    <div *ngIf="isAuthenticated">Welcome {{ patient?.name?.[0]?.given?.[0] }}!</div>
  `
})
export class PatientComponent implements OnInit {
  authClient = new SMARTAuthClient('epic')
  fhirClient = new FHIRClient({ providerId: 'epic', authClient: this.authClient })

  isAuthenticated = false
  patient: any = null

  async ngOnInit() {
    this.isAuthenticated = await this.authClient.isAuthenticated()

    if (this.isAuthenticated) {
      const patientId = await this.authClient.getPatientId()
      this.patient = await this.fhirClient.read('Patient', patientId!)
    }
  }

  async login() {
    const authUrl = await this.authClient.authorize()
    window.location.href = authUrl
  }
}
```

### 7. Server-Side Usage (Node.js, Next.js API Routes)

```typescript
// api/fhir/patient.ts
import { SMARTAuthClient, FHIRClient } from '@/sdk'

export async function GET(req: Request) {
  // Get token from request headers/cookies
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  // Use clients server-side
  const authClient = new SMARTAuthClient('epic')
  const fhirClient = new FHIRClient({ providerId: 'epic', authClient })

  // Fetch data
  const patient = await fhirClient.read('Patient', 'patient-123')

  return Response.json(patient)
}
```

### 8. Custom Storage Implementation

Replace default localStorage with your own:

```typescript
import { SMARTAuthClient, TokenStorage } from '@/sdk'

// Your custom storage (e.g., encrypted, database, Redis)
class SecureTokenStorage implements TokenStorage {
  async getAccessToken(): Promise<string | null> {
    return await myEncryptedStore.get('access_token')
  }

  async setAccessToken(token: string): Promise<void> {
    await myEncryptedStore.set('access_token', encrypt(token))
  }

  // ... implement other methods
}

// Use it
const authClient = new SMARTAuthClient('epic', {
  storage: new SecureTokenStorage()
})
```

### 9. Custom Provider Configuration

Add your own EMR:

```typescript
import { emrRegistry } from '@/sdk'

// Register custom EMR
emrRegistry.registerProvider({
  id: 'my-custom-emr',
  name: 'My Custom EMR',
  authUrl: 'https://my-emr.com/oauth/authorize',
  tokenUrl: 'https://my-emr.com/oauth/token',
  fhirBaseUrl: 'https://my-emr.com/fhir/r4',
  clientId: process.env.CUSTOM_EMR_CLIENT_ID!,
  redirectUri: process.env.REDIRECT_URI!,
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

// Use it immediately
const authClient = new SMARTAuthClient('my-custom-emr')
```

### 10. Add Request/Response Interceptors

Customize behavior without modifying the SDK:

```typescript
import { FHIRClient } from '@/sdk'

const fhirClient = new FHIRClient({ providerId: 'epic', authClient })

// Add custom headers
fhirClient.addRequestInterceptor((url, options) => {
  return {
    url,
    options: {
      ...options,
      headers: {
        ...options.headers,
        'X-Custom-Header': 'my-value',
        'X-Request-ID': generateRequestId(),
      }
    }
  }
})

// Transform responses
fhirClient.addResponseInterceptor((response, data) => {
  console.log('Response received:', data)

  // Add custom properties
  return {
    ...data,
    _fetchedAt: new Date().toISOString(),
  }
})
```

## Integration Patterns

### Pattern 1: Minimal (Just Auth)

```typescript
import { SMARTAuthClient } from '@/sdk'

const auth = new SMARTAuthClient('epic')

// That's it! Use your own FHIR client
```

### Pattern 2: Auth + FHIR Client

```typescript
import { SMARTAuthClient, FHIRClient } from '@/sdk'

const auth = new SMARTAuthClient('epic')
const fhir = new FHIRClient({ providerId: 'epic', authClient: auth })

// That's it! Use your own services
```

### Pattern 3: Full Stack (All Features)

```typescript
import { useFHIR } from '@/sdk'

const everything = useFHIR('epic')

// All features included
```

## Key Takeaways

### ✅ The SDK is NOT tightly coupled
- Each layer can be used independently
- PatientService is just **one example service**
- You can create your own services (AllergyService, LabService, etc.)
- Hooks are **convenience wrappers** - not required

### ✅ The SDK is framework-agnostic
- React hooks are **optional**
- Core SDK works with any framework
- Server-side compatible

### ✅ The SDK is provider-agnostic
- Works with **any SMART on FHIR provider**
- Easy to add custom EMRs
- Handles provider-specific quirks automatically

### ✅ The SDK is extensible
- Add custom services
- Add custom storage
- Add custom interceptors
- Override any behavior

## Common Integration Scenarios

| Scenario | What to Use |
|----------|-------------|
| Simple React app | `useFHIR` hook (all-in-one) |
| React app with custom logic | Composable hooks (`useAuth`, `useFHIRClient`) |
| Vue/Angular/Svelte app | Core classes (`SMARTAuthClient`, `FHIRClient`) |
| Node.js backend | Core classes |
| Custom storage needed | Core classes + custom `TokenStorage` |
| Custom EMR provider | `emrRegistry.registerProvider` |
| Need only OAuth | `SMARTAuthClient` only |
| Need custom services | Core classes + your own service layer |

## Conclusion

The SDK is **modular by design**:

1. **Layer 1-2**: Foundation (required for OAuth + FHIR)
2. **Layer 3**: FHIR Client (optional - use your own if you prefer)
3. **Layer 4**: Services (optional - examples, create your own)
4. **Layer 5**: React Hooks (optional - React-specific)

You can:
- ✅ Use just the auth layer
- ✅ Use auth + FHIR client
- ✅ Use everything
- ✅ Mix and match as needed
- ✅ Replace any layer with your own implementation

**The SDK adapts to your needs, not the other way around.**
