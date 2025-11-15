# Production Deployment Guide

## Overview

The FHIR SDK supports **dynamic configuration** for production deployment. Instead of hardcoding client IDs in environment variables, you can pass them from your backend, admin panel, or database at runtime.

---

## Why Dynamic Configuration?

### ❌ Problems with Hardcoded Config
- Client IDs exposed in frontend code
- Can't add new EMRs without redeployment
- No per-customer customization
- Security risk

### ✅ Benefits of Dynamic Config
- Client IDs fetched from secure backend
- Add/remove EMRs without code changes
- Per-customer/tenant configuration
- Better security
- Easier to manage

---

## Supported EMR Providers

The SDK now includes templates for **7 major EMR systems**:

| Provider ID | Name | PKCE | Notes |
|-------------|------|------|-------|
| `epic` | Epic Systems | ✅ | Most widely used |
| `cerner` | Cerner (Oracle Health) | ❌ | Requires TENANT_ID |
| `athena` | Athena Health | ✅ | JWT token parsing |
| `allscripts` | Allscripts | ❌ | No refresh token |
| `nextgen` | NextGen Healthcare | ✅ | Full SMART support |
| `meditech` | Meditech | ✅ | Standard FHIR |
| `eclinicalworks` | eClinicalWorks | ✅ | Standard FHIR |

---

## Two Initialization Methods

### Method 1: Environment Variables (Development)

Good for **local development** and testing.

**File:** `src/app/sdk-init.ts` (Already configured)

```typescript
import { initializeSDKFromEnv } from '@/sdk';

// Reads from .env.local
initializeSDKFromEnv();
```

**`.env.local`:**
```env
NEXT_PUBLIC_EPIC_CLIENT_ID=your-epic-client-id
NEXT_PUBLIC_CERNER_CLIENT_ID=your-cerner-client-id
NEXT_PUBLIC_CERNER_TENANT_ID=your-tenant-id
NEXT_PUBLIC_ATHENA_CLIENT_ID=your-athena-client-id
NEXT_PUBLIC_NEXTGEN_CLIENT_ID=your-nextgen-client-id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
```

### Method 2: Dynamic Configuration (Production)

Good for **production** deployment.

**File:** `src/app/sdk-init.ts` (Modify this)

```typescript
import { initializeSDK } from '@/sdk';

// Fetch from your API
async function initSDK() {
  const response = await fetch('/api/emr-config');
  const config = await response.json();

  initializeSDK(config.providers);
}

initSDK();
```

---

## Production Setup Examples

### Example 1: Fetch from Backend API

```typescript
// src/app/sdk-init.ts
import { initializeSDK } from '@/sdk';

async function initializeFromBackend() {
  try {
    const response = await fetch('/api/admin/emr-providers', {
      headers: {
        'Authorization': `Bearer ${getAdminToken()}`,
      },
    });

    const config = await response.json();

    // config format:
    // {
    //   providers: [
    //     {
    //       providerId: 'epic',
    //       clientId: 'abc123',
    //       redirectUri: 'https://yourapp.com/callback'
    //     }
    //   ]
    // }

    initializeSDK(config.providers);
  } catch (error) {
    console.error('Failed to initialize SDK:', error);
  }
}

initializeFromBackend();
```

### Example 2: Multi-Tenant Configuration

```typescript
// src/app/sdk-init.ts
import { initializeSDK } from '@/sdk';

async function initializeForTenant() {
  const tenantId = getTenantId(); // From auth, subdomain, etc.

  const response = await fetch(`/api/tenants/${tenantId}/emr-config`);
  const config = await response.json();

  initializeSDK(config.providers);
}

initializeForTenant();
```

### Example 3: Database Configuration

```typescript
// Backend API: /api/admin/emr-providers
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // Fetch from database
  const providers = await prisma.emrProvider.findMany({
    where: { enabled: true },
    select: {
      providerId: true,
      clientId: true,
      redirectUri: true,
      urlParams: true,
    },
  });

  return Response.json({ providers });
}
```

---

## Configuration Format

### Basic Provider Config

```typescript
{
  providerId: 'epic',           // Required: 'epic' | 'cerner' | 'athena' | etc.
  clientId: 'your-client-id',   // Required: From EMR portal
  redirectUri: 'https://...',   // Required: Your callback URL
}
```

### Provider with URL Parameters (Cerner)

```typescript
{
  providerId: 'cerner',
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  urlParams: {
    TENANT_ID: 'your-cerner-tenant-id'  // Required for Cerner
  }
}
```

### Provider with Custom Configuration

```typescript
{
  providerId: 'epic',
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  customConfig: {
    scopes: ['openid', 'fhirUser', 'patient/*.read'],  // Override scopes
    oauth: {
      pkce: false  // Disable PKCE if needed
    }
  }
}
```

---

## Database Schema Example

### PostgreSQL / Prisma Schema

```prisma
model EMRProvider {
  id          String   @id @default(cuid())
  tenantId    String?  // Optional: For multi-tenant
  providerId  String   // 'epic', 'cerner', etc.
  name        String   // Display name
  clientId    String   // From EMR
  redirectUri String   // Callback URL
  urlParams   Json?    // Extra params (e.g., TENANT_ID)
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, providerId])
  @@index([tenantId])
}
```

---

## Admin Panel Integration

### Create Provider Form

```tsx
'use client';

import { useState } from 'react';

export function CreateEMRProviderForm() {
  const [config, setConfig] = useState({
    providerId: 'epic',
    clientId: '',
    redirectUri: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch('/api/admin/emr-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    alert('Provider added!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={config.providerId}
        onChange={(e) => setConfig({ ...config, providerId: e.target.value })}
      >
        <option value="epic">Epic</option>
        <option value="cerner">Cerner</option>
        <option value="athena">Athena Health</option>
        <option value="nextgen">NextGen</option>
        <option value="meditech">Meditech</option>
        <option value="eclinicalworks">eClinicalWorks</option>
        <option value="allscripts">Allscripts</option>
      </select>

      <input
        type="text"
        placeholder="Client ID"
        value={config.clientId}
        onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
      />

      <input
        type="text"
        placeholder="Redirect URI"
        value={config.redirectUri}
        onChange={(e) => setConfig({ ...config, redirectUri: e.target.value })}
      />

      <button type="submit">Add Provider</button>
    </form>
  );
}
```

---

## Security Best Practices

### 1. Never Expose Client Secrets
```typescript
// ❌ BAD: Client secret in frontend
const config = {
  clientId: 'abc123',
  clientSecret: 'secret123',  // NEVER DO THIS!
};

// ✅ GOOD: Only client ID (public)
const config = {
  clientId: 'abc123',
  // No secret - handled by backend
};
```

### 2. Use Server-Side API for Config
```typescript
// ❌ BAD: Direct database access from frontend
const providers = await prisma.emrProvider.findMany();

// ✅ GOOD: Fetch through API
const response = await fetch('/api/emr-config');
const providers = await response.json();
```

### 3. Validate and Sanitize
```typescript
// Backend API
export async function POST(req: Request) {
  const data = await req.json();

  // Validate
  if (!['epic', 'cerner', 'athena', /* ... */].includes(data.providerId)) {
    return Response.json({ error: 'Invalid provider' }, { status: 400 });
  }

  // Sanitize
  const sanitized = {
    providerId: data.providerId,
    clientId: data.clientId.trim(),
    redirectUri: new URL(data.redirectUri).href,  // Validates URL
  };

  // Save to database
  await prisma.emrProvider.create({ data: sanitized });

  return Response.json({ success: true });
}
```

---

## Environment Variables

### Development (.env.local)
```env
# EMR Client IDs
NEXT_PUBLIC_EPIC_CLIENT_ID=your-epic-client-id
NEXT_PUBLIC_CERNER_CLIENT_ID=your-cerner-client-id
NEXT_PUBLIC_CERNER_TENANT_ID=your-tenant-id
NEXT_PUBLIC_ATHENA_CLIENT_ID=your-athena-client-id
NEXT_PUBLIC_NEXTGEN_CLIENT_ID=your-nextgen-client-id
NEXT_PUBLIC_MEDITECH_CLIENT_ID=your-meditech-client-id
NEXT_PUBLIC_ECLINICALWORKS_CLIENT_ID=your-ecw-client-id
NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID=your-allscripts-client-id

# Redirect URI
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000

# Database (if using dynamic config)
DATABASE_URL=postgresql://...
```

### Production (.env.production)
```env
# No client IDs - fetched from database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_REDIRECT_URI=https://yourapp.com
```

---

## Deployment Checklist

- [ ] Set up database schema for EMR providers
- [ ] Create admin API endpoints (`/api/admin/emr-providers`)
- [ ] Build admin panel for managing providers
- [ ] Update `src/app/sdk-init.ts` to use `initializeSDK()`
- [ ] Remove client IDs from `.env` files
- [ ] Test with at least 2 different EMR providers
- [ ] Verify OAuth flow works in production
- [ ] Set up monitoring and error tracking
- [ ] Document provider onboarding process
- [ ] Train admin users on adding EMRs

---

## Testing

### Test Dynamic Configuration

```typescript
// Test initialization
import { initializeSDK, emrRegistry } from '@/sdk';

const testConfig = [
  {
    providerId: 'epic',
    clientId: 'test-client-id',
    redirectUri: 'http://localhost:3000',
  },
];

initializeSDK(testConfig);

// Verify
console.log(emrRegistry.listProviders());
// Should show Epic provider with test client ID
```

---

## Migration from Env to Dynamic Config

### Step 1: Create API Endpoint
```typescript
// app/api/emr-config/route.ts
export async function GET() {
  const providers = [
    {
      providerId: 'epic',
      clientId: process.env.EPIC_CLIENT_ID!,
      redirectUri: process.env.REDIRECT_URI!,
    },
    // ... more providers
  ];

  return Response.json({ providers });
}
```

### Step 2: Update sdk-init.ts
```typescript
// Before
initializeSDKFromEnv();

// After
async function init() {
  const res = await fetch('/api/emr-config');
  const config = await res.json();
  initializeSDK(config.providers);
}
init();
```

### Step 3: Move to Database
Once API works, migrate from env vars to database.

---

## Support

Need help with deployment? Check:
- `/src/sdk/README.md` - SDK documentation
- `/HOW_TO_USE_SDK.md` - Quick start guide
- `/CLEANUP_SUMMARY.md` - What changed

---

**Your SDK is now production-ready with dynamic configuration! 🚀**
