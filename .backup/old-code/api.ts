import { Encounter, Medication, MedicationRequest, Observation, Procedure } from "fhir/r4";

const getFhirBaseUrl = (): string => {
  const fhirBaseUrl = localStorage.getItem('fhirBaseUrl');
  if (!fhirBaseUrl) {
    throw new Error('FHIR Base URL not found in localStorage');
  }
  return fhirBaseUrl;
};

const getHeaders = (accessToken: string): HeadersInit => {
  const selectedEMR = localStorage.getItem('selectedEMR');
  const isCerner = selectedEMR === '2'; // Assuming '2' is the ID for Cerner

  return {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': isCerner ? 'application/json' : 'application/fhir+json',
  };
};

const isCernerEMR = (): boolean => {
  return localStorage.getItem('selectedEMR') === '2';
};

const isAthenaEMR = (): boolean => {
  return localStorage.getItem('selectedEMR') === '5';
};

// Extract patient ID from various token sources
export const getPatientIdFromToken = async (): Promise<string | null> => {
  // First check if patient ID is stored
  let patientId = localStorage.getItem('patient');
  if (patientId && !patientId.startsWith('00u')) { // Avoid Okta user IDs
    return patientId;
  }

  // For Athena, try to extract from id_token
  if (isAthenaEMR()) {
    const idToken = localStorage.getItem('id_token');
    if (idToken) {
      try {
        const tokenParts = idToken.split('.');
        if (tokenParts.length >= 2) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('ID Token payload:', payload);

          // Priority order for patient ID extraction:
          // 1. fhirUser claim (most reliable for FHIR)
          if (payload.fhirUser) {
            if (payload.fhirUser.includes('Patient/')) {
              patientId = payload.fhirUser.split('Patient/')[1].split(/[?#]/)[0];
              console.log('Extracted patient ID from fhirUser:', patientId);
            }
          }

          // 2. patient claim
          if (!patientId && payload.patient) {
            patientId = payload.patient;
            console.log('Extracted patient ID from patient claim:', patientId);
          }

          // 3. patientId claim
          if (!patientId && payload.patientId) {
            patientId = payload.patientId;
            console.log('Extracted patient ID from patientId claim:', patientId);
          }

          // 4. Check context claim (some SMART implementations)
          if (!patientId && payload.context && payload.context.patient) {
            patientId = payload.context.patient;
            console.log('Extracted patient ID from context.patient:', patientId);
          }

          // Don't use 'sub' as it's typically the user ID, not patient ID
          // unless it explicitly contains 'Patient/'
          if (!patientId && payload.sub && payload.sub.includes('Patient/')) {
            patientId = payload.sub.split('Patient/')[1].split(/[?#]/)[0];
            console.log('Extracted patient ID from sub (contains Patient/):', patientId);
          }

          if (patientId) {
            localStorage.setItem('patient', patientId);
            console.log('Final extracted and stored patient ID:', patientId);
            return patientId;
          } else {
            console.error('Could not find patient ID in any expected location. Full payload:', payload);
          }
        }
      } catch (e) {
        console.error('Failed to extract patient from id_token:', e);
      }
    }
  }

  return null;
};

export const fetchPatientData = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();

  // Athena requires patient ID to be non-empty and valid
  if (!patientId || patientId === 'undefined' || patientId === 'null') {
    throw new Error('Invalid patient ID');
  }

  // For Athena, ensure proper patient resource request
  let url = `${FHIR_BASE_URL}/Patient/${patientId}`;

  // Athena may require additional parameters
  if (isAthenaEMR()) {
    // Use query parameter approach for Athena if direct patient ID fails
    const queryParams = new URLSearchParams({
      _id: patientId
    });
    // Try direct ID first, fallback to query if needed
    url = `${FHIR_BASE_URL}/Patient/${patientId}`;
  }

  const response = await fetch(url, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Patient fetch error:', errorText);
    throw new Error(`Failed to fetch patient data: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const fetchPatientMedications = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();

  const queryParams = new URLSearchParams({
    patient: patientId,
  });

  // Add status for non-Athena EMRs
  if (!isAthenaEMR()) {
    queryParams.append('status', 'active,completed,stopped,on-hold,cancelled,entered-in-error,draft,unknown');
  }

  const response = await fetch(`${FHIR_BASE_URL}/MedicationRequest?${queryParams.toString()}`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    if (response.status === 403 && isAthenaEMR()) {
      console.warn('Athena: Access to MedicationRequest resource is restricted');
      return [];
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch patient medications: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : [];
  data = data.filter((med: MedicationRequest) => med.resourceType === 'MedicationRequest');
  return data;
};

export const fetchPatientVitals = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  const response = await fetch(`${FHIR_BASE_URL}/Observation?patient=${patientId}&category=vital-signs&_sort=-date`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    if ((response.status === 403 || response.status === 400) && isAthenaEMR()) {
      console.warn('Athena: Access to Observation (vitals) may be restricted or require different parameters');
      return [];
    }
    throw new Error(`Failed to fetch patient vitals: ${response.status}`);
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : [];
  data = data.filter((med: Observation) => med.resourceType === 'Observation');
  return data;
};

export const fetchPatientAppointments = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();

  // Athena may not support Appointment endpoint or may have restrictions
  if (isAthenaEMR()) {
    console.warn('Athena: Appointment endpoint may not be available in preview environment');
  }

  let queryParams = new URLSearchParams({
    patient: patientId,
  });

  // Only add status for non-Athena
  if (!isAthenaEMR()) {
    queryParams.append('status', 'booked');
  }

  if (isCernerEMR()) {
    const now = new Date();
    const formattedDate = now.toISOString();
    queryParams.append('date', `ge${formattedDate}`);
  }

  const response = await fetch(`${FHIR_BASE_URL}/Appointment?${queryParams.toString()}`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    if (response.status === 403 && isAthenaEMR()) {
      console.warn('Athena: Access to Appointment resource is restricted');
      return { entry: [] }; // Return empty result
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch patient appointments: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return response.json();
};


export const fetchPatientLabReports = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  const response = await fetch(`${FHIR_BASE_URL}/Observation?patient=${patientId}&category=laboratory&_sort=-date`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    if ((response.status === 403 || response.status === 400) && isAthenaEMR()) {
      console.warn('Athena: Access to Observation (lab reports) may be restricted or require different parameters');
      return [];
    }
    throw new Error(`Failed to fetch patient lab reports: ${response.status}`);
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : [];
  data = data.filter((med: Observation) => med.resourceType === 'Observation');
  return data;
};

export const fetchPatientEncounters = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  const response = await fetch(`${FHIR_BASE_URL}/Encounter?patient=${patientId}&_sort=-date&_count=10`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    if ((response.status === 403 || response.status === 400) && isAthenaEMR()) {
      console.warn('Athena: Access to Encounter resource may be restricted');
      return [];
    }
    throw new Error(`Failed to fetch patient encounters: ${response.status}`);
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : [];
  data = data.filter((med: Encounter) => med.resourceType === 'Encounter');
  return data;
};

export const fetchPatientProcedures = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  const response = await fetch(`${FHIR_BASE_URL}/Procedure?patient=${patientId}&_sort=-date&_count=10`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    if ((response.status === 403 || response.status === 400) && isAthenaEMR()) {
      console.warn('Athena: Access to Procedure resource may be restricted');
      return [];
    }
    throw new Error(`Failed to fetch patient procedures: ${response.status}`);
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : [];
  data = data.filter((med: Procedure) => med.resourceType === 'Procedure');
  return data;
};