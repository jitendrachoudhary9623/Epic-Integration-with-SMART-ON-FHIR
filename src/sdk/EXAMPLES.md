# FHIR SDK - Usage Examples

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Advanced Scenarios](#advanced-scenarios)
3. [Custom Configurations](#custom-configurations)
4. [Real-World Examples](#real-world-examples)

## Basic Usage

### Example 1: Simple Patient Dashboard

```tsx
'use client';

import { useFHIR } from '@/sdk';

export default function PatientDashboard() {
  const {
    isAuthenticated,
    login,
    logout,
    patient,
    medications,
    vitals,
    isDataLoading,
  } = useFHIR('epic');

  if (!isAuthenticated) {
    return (
      <div>
        <h1>Patient Portal</h1>
        <button onClick={login}>Login with Epic</button>
      </div>
    );
  }

  if (isDataLoading) {
    return <div>Loading your health data...</div>;
  }

  return (
    <div>
      <header>
        <h1>Welcome, {patient?.name?.[0]?.given?.[0]}!</h1>
        <button onClick={logout}>Logout</button>
      </header>

      <section>
        <h2>Your Medications</h2>
        {medications.map(med => (
          <div key={med.id}>
            <strong>{med.medicationCodeableConcept?.text}</strong>
            <p>{med.dosageInstruction?.[0]?.text}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Latest Vitals</h2>
        {vitals.slice(0, 5).map(vital => (
          <div key={vital.id}>
            {vital.code.text}: {vital.valueQuantity?.value} {vital.valueQuantity?.unit}
          </div>
        ))}
      </section>
    </div>
  );
}
```

### Example 2: EMR Selector

```tsx
'use client';

import { useState } from 'react';
import { useFHIR, emrRegistry } from '@/sdk';

export default function EMRSelector() {
  const [selectedEMR, setSelectedEMR] = useState('epic');
  const { isAuthenticated, login } = useFHIR(selectedEMR);

  const providers = emrRegistry.listProviders();

  if (isAuthenticated) {
    return <div>Redirecting to dashboard...</div>;
  }

  return (
    <div>
      <h1>Select Your Healthcare Provider</h1>
      <div>
        {providers.map(provider => (
          <button
            key={provider.id}
            onClick={() => setSelectedEMR(provider.id)}
            className={selectedEMR === provider.id ? 'active' : ''}
          >
            {provider.name}
          </button>
        ))}
      </div>
      <button onClick={login}>
        Connect to {providers.find(p => p.id === selectedEMR)?.name}
      </button>
    </div>
  );
}
```

### Example 3: OAuth Callback Handler

```tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/sdk';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();
  const { handleCallback } = useAuth('epic');

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleCallback(window.location.href);
        router.push('/dashboard');
      } catch (error) {
        console.error('Authentication failed:', error);
        router.push('/login?error=auth_failed');
      }
    };

    processCallback();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="spinner" />
        <p>Completing authentication...</p>
      </div>
    </div>
  );
}
```

## Advanced Scenarios

### Example 4: Filtering and Searching Observations

```tsx
'use client';

import { useState } from 'react';
import { useAuth, useFHIRClient, usePatientService } from '@/sdk';

export default function ObservationsPage() {
  const { patientId, authClient } = useAuth('epic');
  const fhirClient = useFHIRClient('epic', authClient);
  const patientService = usePatientService(fhirClient);

  const [observations, setObservations] = useState([]);
  const [category, setCategory] = useState('vital-signs');
  const [dateRange, setDateRange] = useState('last-year');

  const fetchObservations = async () => {
    if (!patientId) return;

    const date = getDateFilter(dateRange);

    const results = category === 'vital-signs'
      ? await patientService.getVitals(patientId, { date })
      : await patientService.getLabReports(patientId, { date });

    setObservations(results);
  };

  return (
    <div>
      <h1>Health Observations</h1>

      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="vital-signs">Vital Signs</option>
        <option value="laboratory">Lab Reports</option>
      </select>

      <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
        <option value="last-week">Last Week</option>
        <option value="last-month">Last Month</option>
        <option value="last-year">Last Year</option>
      </select>

      <button onClick={fetchObservations}>Search</button>

      <div>
        {observations.map(obs => (
          <div key={obs.id}>
            <h3>{obs.code.text}</h3>
            <p>Date: {obs.effectiveDateTime}</p>
            <p>
              Value: {obs.valueQuantity?.value} {obs.valueQuantity?.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDateFilter(range: string): string {
  const now = new Date();
  const past = new Date();

  switch (range) {
    case 'last-week':
      past.setDate(now.getDate() - 7);
      break;
    case 'last-month':
      past.setMonth(now.getMonth() - 1);
      break;
    case 'last-year':
      past.setFullYear(now.getFullYear() - 1);
      break;
  }

  return `ge${past.toISOString().split('T')[0]}`;
}
```

### Example 5: Direct FHIR Client Usage

```typescript
import { FHIRClient, SMARTAuthClient } from '@/sdk';

async function advancedFHIROperations() {
  const authClient = new SMARTAuthClient('epic');
  const fhirClient = new FHIRClient({
    providerId: 'epic',
    authClient,
  });

  // Read specific resource
  const patient = await fhirClient.read('Patient', 'patient-123');

  // Search with complex parameters
  const observations = await fhirClient.search('Observation', {
    patient: 'patient-123',
    category: 'vital-signs',
    code: 'http://loinc.org|85354-9', // Blood pressure
    date: 'ge2023-01-01',
    _sort: '-date',
    _count: 10,
  });

  // Search by patient
  const encounters = await fhirClient.searchByPatient(
    'Encounter',
    'patient-123',
    {
      status: 'finished',
      date: 'ge2023-01-01',
    }
  );

  return { patient, observations, encounters };
}
```

### Example 6: Custom Interceptors

```typescript
import { FHIRClient } from '@/sdk';

const fhirClient = new FHIRClient({ providerId: 'epic', authClient });

// Add logging interceptor
fhirClient.addRequestInterceptor(async (url, options) => {
  console.log('Making request to:', url);
  console.log('With options:', options);
  return { url, options };
});

// Add response timing interceptor
fhirClient.addResponseInterceptor(async (response, data) => {
  console.log('Response status:', response.status);
  console.log('Response time:', response.headers.get('x-response-time'));
  return data;
});

// Add custom header interceptor
fhirClient.addRequestInterceptor(async (url, options) => {
  return {
    url,
    options: {
      ...options,
      headers: {
        ...options.headers,
        'X-Request-ID': crypto.randomUUID(),
        'X-Client-Version': '1.0.0',
      },
    },
  };
});

// Add data transformation interceptor
fhirClient.addResponseInterceptor(async (response, data) => {
  // Transform all dates to local timezone
  if (data.entry) {
    data.entry.forEach(entry => {
      if (entry.resource.effectiveDateTime) {
        entry.resource.effectiveDateTime = new Date(
          entry.resource.effectiveDateTime
        ).toLocaleString();
      }
    });
  }
  return data;
});
```

## Custom Configurations

### Example 7: Adding a Custom EMR Provider

```typescript
import { emrRegistry, EMRProviderConfig } from '@/sdk';

// Define custom provider
const customProvider: EMRProviderConfig = {
  id: 'my-hospital',
  name: 'My Hospital System',
  authUrl: 'https://my-hospital.com/oauth/authorize',
  tokenUrl: 'https://my-hospital.com/oauth/token',
  fhirBaseUrl: 'https://my-hospital.com/fhir/r4',
  clientId: process.env.NEXT_PUBLIC_MY_HOSPITAL_CLIENT_ID!,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
  scopes: [
    'patient/*.read',
    'openid',
    'fhirUser',
    'offline_access',
  ],
  oauth: {
    flow: 'authorization_code',
    pkce: true,
  },
  capabilities: {
    supportedResources: [
      'Patient',
      'Observation',
      'MedicationRequest',
      'Appointment',
    ],
    supportsRefreshToken: true,
  },
  quirks: {
    acceptHeader: 'application/fhir+json',
    patientIdLocation: 'token.patient',
    filterByResourceType: true,
    supportsPagination: true,
    tokenParsingStrategy: 'standard',
    customHeaders: {
      'X-Hospital-ID': '12345',
    },
  },
};

// Register provider
emrRegistry.registerProvider(customProvider);

// Use it
const { patient, medications } = useFHIR('my-hospital');
```

### Example 8: Provider with URL Parameters (like Cerner)

```typescript
import { emrRegistry, EMRProviderConfig } from '@/sdk';

const customCernerProvider: EMRProviderConfig = {
  id: 'cerner-custom',
  name: 'Custom Cerner Instance',
  authUrl: 'https://authorization.cerner.com/tenants/{TENANT_ID}/protocols/oauth2/profiles/smart-v1/personas/patient/authorize',
  tokenUrl: 'https://authorization.cerner.com/tenants/{TENANT_ID}/hosts/fhir-myrecord.cerner.com/protocols/oauth2/profiles/smart-v1/token',
  fhirBaseUrl: 'https://fhir-myrecord.cerner.com/r4/{TENANT_ID}',
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['patient/*.read', 'openid'],
  oauth: {
    flow: 'authorization_code',
    pkce: false,
  },
  quirks: {
    urlParams: {
      TENANT_ID: 'your-tenant-id-here',
    },
  },
};

// URLs will automatically have {TENANT_ID} replaced
emrRegistry.registerProvider(customCernerProvider);
```

## Real-World Examples

### Example 9: Multi-Provider Healthcare App

```tsx
'use client';

import { useState, useEffect } from 'react';
import { emrRegistry, DEFAULT_PROVIDERS, useFHIR } from '@/sdk';

// Initialize on app startup
emrRegistry.registerProviders(DEFAULT_PROVIDERS);

export default function HealthApp() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Check if user has an active session
  useEffect(() => {
    const savedProvider = localStorage.getItem('selected_emr');
    if (savedProvider) {
      setSelectedProvider(savedProvider);
    }
  }, []);

  if (!selectedProvider) {
    return <ProviderSelector onSelect={setSelectedProvider} />;
  }

  return <HealthDashboard providerId={selectedProvider} />;
}

function ProviderSelector({ onSelect }) {
  const providers = emrRegistry.listProviders();

  return (
    <div className="provider-selector">
      <h1>Connect Your Health Records</h1>
      <div className="provider-grid">
        {providers.map(provider => (
          <button
            key={provider.id}
            onClick={() => {
              localStorage.setItem('selected_emr', provider.id);
              onSelect(provider.id);
            }}
            className="provider-card"
          >
            <img src={`/logos/${provider.id}.png`} alt={provider.name} />
            <h3>{provider.name}</h3>
          </button>
        ))}
      </div>
    </div>
  );
}

function HealthDashboard({ providerId }) {
  const {
    isAuthenticated,
    login,
    logout,
    patient,
    medications,
    vitals,
    appointments,
    isDataLoading,
    errors,
    refetch,
  } = useFHIR(providerId);

  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <h1>Login Required</h1>
        <button onClick={login}>
          Connect to {emrRegistry.getProvider(providerId).name}
        </button>
      </div>
    );
  }

  if (isDataLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <Header patient={patient} onLogout={logout} onRefresh={refetch} />
      <MedicationsList medications={medications} />
      <VitalsList vitals={vitals} />
      <AppointmentsList appointments={appointments} />
      {Object.keys(errors).length > 0 && <ErrorDisplay errors={errors} />}
    </div>
  );
}
```

### Example 10: Error Handling and Retry Logic

```tsx
'use client';

import { useState } from 'react';
import { useAuth, useFHIRClient, usePatientService, FHIRError } from '@/sdk';

export default function RobustDataFetcher() {
  const { patientId, authClient } = useAuth('epic');
  const fhirClient = useFHIRClient('epic', authClient);
  const patientService = usePatientService(fhirClient);

  const [data, setData] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchWithRetry = async (maxRetries = 3) => {
    if (!patientId) return;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setError(null);
        const result = await patientService.getAllPatientData(patientId);
        setData(result);
        setRetryCount(0);
        return;
      } catch (err) {
        if (err instanceof FHIRError) {
          // Don't retry client errors (4xx)
          if (err.statusCode >= 400 && err.statusCode < 500) {
            setError(`Client error: ${err.message}`);
            return;
          }

          // Retry server errors (5xx) and network errors
          if (attempt < maxRetries) {
            setRetryCount(attempt + 1);
            // Exponential backoff
            await new Promise(resolve =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
            continue;
          }

          setError(`Failed after ${maxRetries} retries: ${err.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      }
    }
  };

  return (
    <div>
      <button onClick={() => fetchWithRetry()}>Fetch Data</button>
      {retryCount > 0 && <p>Retrying... (Attempt {retryCount})</p>}
      {error && <div className="error">{error}</div>}
      {data && <DataDisplay data={data} />}
    </div>
  );
}
```

### Example 11: Medication Management Dashboard

```tsx
'use client';

import { useFHIR } from '@/sdk';
import { useState } from 'react';

export default function MedicationManager() {
  const { medications, isDataLoading, refetch } = useFHIR('epic');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredMeds = medications.filter(med => {
    if (filter === 'all') return true;
    return med.status === filter;
  });

  const groupedByCategory = filteredMeds.reduce((acc, med) => {
    const category = med.medicationCodeableConcept?.coding?.[0]?.display || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(med);
    return acc;
  }, {} as Record<string, typeof medications>);

  if (isDataLoading) return <LoadingSpinner />;

  return (
    <div className="medication-manager">
      <header>
        <h1>My Medications</h1>
        <button onClick={refetch}>Refresh</button>
      </header>

      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({medications.length})
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active ({medications.filter(m => m.status === 'active').length})
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed ({medications.filter(m => m.status === 'completed').length})
        </button>
      </div>

      {Object.entries(groupedByCategory).map(([category, meds]) => (
        <section key={category}>
          <h2>{category}</h2>
          {meds.map(med => (
            <div key={med.id} className="medication-card">
              <h3>{med.medicationCodeableConcept?.text}</h3>
              <p className="dosage">{med.dosageInstruction?.[0]?.text}</p>
              <p className="date">Prescribed: {med.authoredOn}</p>
              <span className={`status ${med.status}`}>{med.status}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
```

These examples demonstrate the power and flexibility of the FHIR SDK, showing how it reduces boilerplate while providing full control when needed.
