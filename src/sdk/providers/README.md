# Provider Configuration Guide

## IMPORTANT: SDK is 100% Generic

**The SDK does NOT hardcode ANY configurations.** Everything you see in `configs.ts` and `templates.ts` are **EXAMPLES ONLY** for convenience.

## Two Ways to Configure

### 1. Full Control (Recommended for Production)

Pass complete configuration - SDK uses exactly what you provide:

```typescript
import { emrRegistry } from '@nirmiteeio/fhir-sdk';

emrRegistry.registerProvider({
  id: 'epic',
  name: 'Epic Systems',
  authUrl: 'https://...',
  tokenUrl: 'https://...',
  fhirBaseUrl: 'https://...',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: 'YOUR_REDIRECT_URI',
  scopes: ['YOUR', 'CUSTOM', 'SCOPES'],  // ← YOU define these!
  oauth: {
    flow: 'authorization_code',
    pkce: true,
    responseType: 'code',
  },
  capabilities: {
    supportedResources: ['Patient', 'Observation'],
    supportsRefreshToken: true,
  },
  quirks: {
    acceptHeader: 'application/fhir+json',
    patientIdLocation: 'token.patient',
  },
});
```

**SDK will use EXACTLY what you pass. Zero hardcoding.**

### 2. Templates (Convenience Only)

Use predefined templates and override as needed:

```typescript
import { initializeSDK } from '@nirmiteeio/fhir-sdk';

initializeSDK([
  {
    providerId: 'epic',
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: 'YOUR_REDIRECT_URI',
    customConfig: {
      scopes: ['YOUR', 'CUSTOM', 'SCOPES'],  // ← Override template scopes
    },
  },
]);
```

## What Are Templates?

Templates in `templates.ts` are **starting points** with common settings:
- URLs for sandbox/production environments
- Common scopes that MOST apps need
- Default quirks for each EMR

**You can override EVERYTHING including scopes.**

## What Are Configs?

Configs in `configs.ts` are **examples only**:
- Show how to structure provider configs
- Used for SDK testing
- NOT used unless you explicitly import them

## Scopes: YOU Are In Control

The SDK **NEVER** hardcodes scopes. Here's how scopes work:

```typescript
// auth-client.ts line 51:
scope: this.provider.scopes.join(' ')  // ← Uses YOUR scopes
```

The SDK takes whatever scopes you provide and passes them to the OAuth flow.

### Custom Scopes Example

```typescript
emrRegistry.registerProvider({
  id: 'epic',
  // ... other config
  scopes: [
    // Standard
    'openid',
    'fhirUser',

    // Custom for your app
    'patient/Patient.read',
    'patient/CustomResource.read',
    'user/Practitioner.read',
    'launch/patient',
    'offline_access',
  ],
});
```

## Best Practices

### 1. Production: Use Full Config
```typescript
// ✅ Good: Full control
const config = {
  id: 'epic',
  scopes: fetchScopesFromYourAPI(), // Dynamic!
  // ... full config
};
emrRegistry.registerProvider(config);
```

### 2. Development: Use Templates
```typescript
// ✅ Good: Quick setup for testing
initializeSDK([{
  providerId: 'epic',
  clientId: process.env.CLIENT_ID,
  redirectUri: process.env.REDIRECT_URI,
}]);
```

### 3. Database-Driven Config
```typescript
// ✅ Best: Fetch from database
const configs = await fetchEMRConfigsFromDB();
emrRegistry.registerProviders(configs);
```

## Files in This Directory

| File | Purpose | When to Use |
|------|---------|-------------|
| `registry.ts` | Core registry engine | Always used |
| `configs.ts` | Example configurations | Optional reference |
| `templates.ts` | Convenience templates | Optional quick start |
| `init-helper.ts` | Helper functions | Optional convenience |
| `init-simple.ts` | Simplified init | Optional quick start |

## Summary

- ✅ SDK is **100% generic** - no hardcoding
- ✅ Scopes are **always user-defined**
- ✅ Templates are **optional convenience**
- ✅ You have **complete control**
- ✅ Override **anything and everything**

**When in doubt, pass full config. SDK will use exactly what you provide.**
