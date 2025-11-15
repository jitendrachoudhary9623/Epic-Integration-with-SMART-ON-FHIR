# Implementation Guide: How Your App Uses the FHIR SDK

This guide explains **exactly** how your app integrates with the FHIR SDK, ensuring you're doing everything correctly.

## ✅ Your Implementation is CORRECT!

You're using the SDK properly with **full control** over all configurations.

## Flow: From Config to UI

```
1. Environment Variables (.env)
   ↓
2. EMR Configs (src/app/emr-configs.ts) ← YOU define ALL settings here
   ↓
3. SDK Initialization (src/app/sdk-init.ts) ← Passes your configs to SDK
   ↓
4. SDK Registry (SDK stores your configs)
   ↓
5. Components use SDK hooks ← SDK uses your configs exactly
```

## Step-by-Step Breakdown

### 1. Environment Variables (`.env.local`)

You define credentials in environment variables:

```bash
# Epic
NEXT_PUBLIC_CLIENT_ID=your-epic-client-id
NEXT_PUBLIC_SMART_AUTH_URL=https://fhir.epic.com/.../authorize
NEXT_PUBLIC_SMART_TOKEN_URL=https://fhir.epic.com/.../token
NEXT_PUBLIC_FHIR_BASE_URL=https://fhir.epic.com/.../FHIR/R4

# Cerner
NEXT_PUBLIC_CERNER_CLIENT_ID=your-cerner-client-id
NEXT_PUBLIC_CERNER_TENANT_ID=your-tenant-id

# Athena
NEXT_PUBLIC_ATHENA_CLIENT_ID=your-athena-client-id
NEXT_PUBLIC_ATHENA_AUTH_URL=https://api.preview.platform.athenahealth.com/.../authorize
NEXT_PUBLIC_ATHENA_TOKEN_URL=https://api.preview.platform.athenahealth.com/.../token
NEXT_PUBLIC_ATHENA_FHIR_BASE_URL=https://api.preview.platform.athenahealth.com/fhir/r4
NEXT_PUBLIC_ATHENA_REDIRECT_URI=http://localhost:3000

# Allscripts
NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID=your-allscripts-client-id
NEXT_PUBLIC_ALLSCRIPTS_AUTH_URL=https://cloud.unitysandbox.com/oauth/authorize
NEXT_PUBLIC_ALLSCRIPTS_TOKEN_URL=https://cloud.unitysandbox.com/oauth/token
NEXT_PUBLIC_ALLSCRIPTS_FHIR_BASE_URL=https://cloud.unitysandbox.com/fhir

# Common
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
```

### 2. EMR Configs (`src/app/emr-configs.ts`)

**THIS IS WHERE YOU CONTROL EVERYTHING!**

```typescript
import type { EMRProviderConfig } from '@/sdk';
import { HTTP_STATUS } from '@/sdk';

export const EMR_CONFIGS: EMRProviderConfig[] = [
  {
    id: 'epic',
    name: 'Epic Systems',
    authUrl: process.env.NEXT_PUBLIC_SMART_AUTH_URL!,
    tokenUrl: process.env.NEXT_PUBLIC_SMART_TOKEN_URL!,
    fhirBaseUrl: process.env.NEXT_PUBLIC_FHIR_BASE_URL!,
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,

    // ✅ YOU define scopes - SDK doesn't hardcode anything
    scopes: ['openid', 'fhirUser'],

    oauth: {
      flow: 'authorization_code',
      pkce: true,  // ← YOU choose PKCE on/off
      responseType: 'code',
    },

    capabilities: {
      supportedResources: ['Patient', 'Observation', 'MedicationRequest'],  // ← YOU list what's supported
      supportsRefreshToken: true,  // ← YOU decide
    },

    quirks: {
      acceptHeader: 'application/fhir+json',  // ← YOU set headers
      patientIdLocation: 'token.patient',  // ← YOU tell SDK where patient ID is
      filterByResourceType: true,
      supportsPagination: true,
      tokenParsingStrategy: 'standard',  // ← 'standard' or 'jwt'
    },
  },

  // Athena with different settings
  {
    id: 'athena',
    name: 'Athena Health',
    // ... URLs from env

    // ✅ Different scopes for Athena
    scopes: [
      'patient/Patient.read',
      'patient/AllergyIntolerance.read',
      'patient/MedicationRequest.read',
      'patient/Observation.read',
      'openid',
      'fhirUser',
      'launch/patient',
      'offline_access',
    ],

    quirks: {
      acceptHeader: 'application/fhir+json',
      patientIdLocation: 'id_token.fhirUser',  // ← Different location!
      notFoundStatusCodes: [HTTP_STATUS.FORBIDDEN],  // ← Athena returns 403 for not found
      tokenParsingStrategy: 'jwt',  // ← Athena uses JWT
    },
  },
];

// ✅ Helper to filter only configured EMRs
export function getConfiguredEMRs(): EMRProviderConfig[] {
  return EMR_CONFIGS.filter(config =>
    config.clientId &&
    config.authUrl &&
    config.tokenUrl &&
    config.fhirBaseUrl
  );
}
```

**Key Point**: SDK has **ZERO** say in these configs. You control:
- Scopes
- URLs
- OAuth flow
- PKCE on/off
- Token parsing
- Error handling
- Everything!

### 3. SDK Initialization (`src/app/sdk-init.ts`)

```typescript
import { emrRegistry } from '@/sdk';
import { getConfiguredEMRs } from './emr-configs';

// Get YOUR configs
const emrConfigs = getConfiguredEMRs();

// Pass to SDK - SDK just stores them, doesn't modify anything
emrRegistry.registerProviders(emrConfigs);

console.log(`✅ SDK initialized with ${emrConfigs.length} EMR(s)`,
  emrConfigs.map(c => c.name).join(', ')
);
```

**What happens here**:
1. `getConfiguredEMRs()` filters your configs (only those with credentials)
2. `emrRegistry.registerProviders()` stores them in SDK's registry
3. SDK does **NOT** modify or add anything

### 4. Components Use SDK

#### Login Component (`src/components/Login.tsx`)

```typescript
import { useAuth, emrRegistry } from '@/sdk';

const Login = () => {
  const [selectedProviderId, setSelectedProviderId] = useState('epic');

  // Get list of available providers (from YOUR configs)
  const providers = emrRegistry.listProviders();

  // Get auth client for selected provider
  const authClient = useAuth(selectedProviderId);

  const handleLogin = async () => {
    // SDK generates auth URL using YOUR config
    const authUrl = await authClient.authorize();
    window.location.href = authUrl;
  };

  return (
    <div>
      <select onChange={(e) => setSelectedProviderId(e.target.value)}>
        {providers.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};
```

**What SDK does**:
1. Uses YOUR scopes: `scope: this.provider.scopes.join(' ')`
2. Uses YOUR URLs: `authUrl`, `tokenUrl`
3. Uses YOUR OAuth settings: `pkce`, `responseType`
4. Nothing is hardcoded!

#### Dashboard Component (`src/components/Dashboard.tsx`)

```typescript
import { useFHIR } from '@/sdk';

const Dashboard = () => {
  const providerId = localStorage.getItem('selected_provider_id') || 'epic';

  // 🎉 ONE HOOK TO RULE THEM ALL! 🎉
  const {
    // Auth
    isAuthenticated,
    logout,

    // All patient data - automatically fetched!
    patient,
    medications,
    vitals,
    labReports,
    appointments,

    // Loading states
    isDataLoading,
    errors,
    refetch,
  } = useFHIR(providerId);

  return (
    <div>
      <h1>Welcome {patient?.name?.[0]?.given?.[0]}!</h1>
      <p>Medications: {medications.length}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

**What SDK does**:
1. Looks up YOUR config by `providerId`
2. Fetches data from YOUR `fhirBaseUrl`
3. Uses YOUR token storage
4. Parses tokens using YOUR `tokenParsingStrategy`
5. Handles errors based on YOUR `quirks`

## Configuration Options Explained

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique identifier | `'epic'`, `'cerner'` |
| `name` | Display name | `'Epic Systems'` |
| `authUrl` | OAuth authorization URL | `https://...` |
| `tokenUrl` | OAuth token exchange URL | `https://...` |
| `fhirBaseUrl` | FHIR API base URL | `https://.../FHIR/R4` |
| `clientId` | Your app's client ID | From EHR registration |
| `redirectUri` | OAuth callback URL | `http://localhost:3000` |
| `scopes` | OAuth scopes (YOU define!) | `['openid', 'fhirUser']` |

### OAuth Configuration

```typescript
oauth: {
  flow: 'authorization_code',  // Always this for SMART on FHIR
  pkce: true,                   // true = use PKCE, false = basic auth code
  responseType: 'code',         // Always 'code' for auth code flow
}
```

### Capabilities

```typescript
capabilities: {
  supportedResources: [         // Which FHIR resources this EMR supports
    'Patient',
    'Observation',
    'MedicationRequest',
    'Appointment',
    'Encounter',
    'Procedure',
  ],
  supportsRefreshToken: true,   // Does EMR issue refresh tokens?
}
```

### Quirks (EMR-Specific Behaviors)

```typescript
quirks: {
  // HTTP Accept header for FHIR requests
  acceptHeader: 'application/fhir+json',  // or 'application/json'

  // Where to find patient ID after auth
  patientIdLocation: 'token.patient',     // or 'id_token.fhirUser'

  // Status codes that mean "not found" (not just 404)
  notFoundStatusCodes: [HTTP_STATUS.FORBIDDEN],  // Athena returns 403

  // Does EMR require resource type in queries?
  filterByResourceType: true,

  // Does EMR support pagination?
  supportsPagination: true,

  // How to parse access token
  tokenParsingStrategy: 'standard',       // or 'jwt' for JWTs

  // URL placeholders (for Cerner's {TENANT_ID})
  urlParams: {
    TENANT_ID: 'your-tenant-id',
  },

  // Resources that require date filters
  requiresDateFilter: {
    Appointment: false,  // false = dates optional
  },
}
```

## How SDK Uses Your Config

### Authorization Flow

```typescript
// SDK auth-client.ts (simplified)
async authorize() {
  // Uses YOUR scopes
  const scope = this.provider.scopes.join(' ');

  // Uses YOUR URLs
  const url = new URL(this.provider.authUrl);
  url.searchParams.append('client_id', this.provider.clientId);
  url.searchParams.append('redirect_uri', this.provider.redirectUri);
  url.searchParams.append('scope', scope);

  // Uses YOUR PKCE setting
  if (this.provider.oauth.pkce) {
    const pkce = await generatePKCEChallenge();
    url.searchParams.append('code_challenge', pkce.code_challenge);
  }

  return url.toString();
}
```

### FHIR Requests

```typescript
// SDK fhir-client.ts (simplified)
async read(resourceType, id) {
  // Uses YOUR base URL
  const url = `${this.provider.fhirBaseUrl}/${resourceType}/${id}`;

  // Uses YOUR accept header
  const headers = {
    'Accept': this.provider.quirks.acceptHeader,
    'Authorization': `Bearer ${await this.getAccessToken()}`,
  };

  const response = await fetch(url, { headers });

  // Uses YOUR not-found status codes
  const notFoundCodes = this.provider.quirks.notFoundStatusCodes || [404];
  if (notFoundCodes.includes(response.status)) {
    return null;  // Resource not found
  }

  return response.json();
}
```

### Token Parsing

```typescript
// SDK auth-client.ts (simplified)
async getPatientId() {
  const location = this.provider.quirks.patientIdLocation;

  if (location === 'token.patient') {
    // Standard: patient ID in token response
    return this.storage.getPatientId();
  } else if (location === 'id_token.fhirUser') {
    // JWT: parse from ID token
    const idToken = await this.storage.getIdToken();
    const decoded = parseJWT(idToken);
    return decoded.fhirUser.split('/').pop();  // Extract from fhirUser URL
  }
}
```

## Summary: You're Doing It Right! ✅

### What YOU Control:
- ✅ All scopes
- ✅ All URLs
- ✅ OAuth flow (PKCE on/off)
- ✅ Token parsing strategy
- ✅ Error handling behavior
- ✅ HTTP headers
- ✅ Resource capabilities
- ✅ Everything!

### What SDK Does:
- ✅ Uses YOUR configs exactly as provided
- ✅ Handles OAuth flow mechanics
- ✅ Manages token storage
- ✅ Makes FHIR API requests
- ✅ Parses responses
- ✅ **Does NOT hardcode anything**

### Your Implementation:
```
src/app/emr-configs.ts  ← YOU define everything here
       ↓
src/app/sdk-init.ts     ← Pass to SDK
       ↓
SDK Registry            ← Stores (doesn't modify)
       ↓
Components              ← Use SDK hooks
       ↓
SDK uses YOUR config    ← Exactly as you provided
```

## Best Practices

### 1. ✅ What You're Already Doing

- Defining all configs in one place (`emr-configs.ts`)
- Filtering only configured EMRs (`getConfiguredEMRs`)
- Using environment variables for credentials
- Passing full configs to SDK
- Not using SDK templates (full control)

### 2. 🚀 Next Level (Optional)

**Fetch configs from database**:
```typescript
// Instead of hardcoding in emr-configs.ts
export async function getEMRConfigs(): Promise<EMRProviderConfig[]> {
  const response = await fetch('/api/emr-configs');
  return response.json();
}
```

**Per-user scopes**:
```typescript
// Different scopes for different users
export function getEMRConfigForUser(userId: string): EMRProviderConfig[] {
  const user = await fetchUser(userId);

  return EMR_CONFIGS.map(config => ({
    ...config,
    scopes: user.role === 'admin'
      ? ['user/*.read', 'user/*.write']  // Admin gets write access
      : ['patient/*.read'],              // Patient gets read only
  }));
}
```

**Dynamic scope override**:
```typescript
// Override scopes at runtime
const authClient = new SMARTAuthClient('epic');
authClient.provider.scopes = ['custom', 'scopes', 'here'];
```

## Files to Review

| File | Purpose | Your Responsibility |
|------|---------|-------------------|
| `src/app/emr-configs.ts` | **Define all EMR configs** | ✅ Update scopes, URLs, quirks |
| `src/app/sdk-init.ts` | Pass configs to SDK | ✅ Keep as-is (no changes needed) |
| `src/components/Login.tsx` | Login UI | ✅ Keep as-is (uses SDK correctly) |
| `src/components/Dashboard.tsx` | Dashboard UI | ✅ Keep as-is (uses SDK correctly) |

## Questions?

**Q: Does SDK hardcode any scopes?**
A: NO. SDK uses `this.provider.scopes` from YOUR config.

**Q: Can I override template scopes?**
A: YES. Pass `customConfig: { scopes: [...] }` when using templates.

**Q: Are SDK configs.ts used?**
A: NO, unless you explicitly import them. They're examples only.

**Q: Is my implementation correct?**
A: YES! ✅ You're using full control mode (best practice).

**Q: Can I change scopes per user?**
A: YES! Modify EMR_CONFIGS based on user before passing to SDK.

---

**Your implementation is production-ready!** 🚀
