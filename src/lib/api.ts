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

export const fetchPatientData = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  const response = await fetch(`${FHIR_BASE_URL}/Patient/${patientId}`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    throw new Error('Failed to fetch patient data');
  }

  return response.json();
};

export const fetchPatientMedications = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  
  // Cerner-specific query parameters
  const queryParams = new URLSearchParams({
    patient: patientId,
    status: 'active,completed,stopped,on-hold,cancelled,entered-in-error,draft,unknown'
  });

  const response = await fetch(`${FHIR_BASE_URL}/MedicationRequest?${queryParams.toString()}`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch patient medications: ${JSON.stringify(errorData)}`);
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
    throw new Error('Failed to fetch patient vitals');
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : []
  data = data.filter((med: Observation) => med.resourceType === 'Observation');
  return data;
};

export const fetchPatientAppointments = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  
  let queryParams = new URLSearchParams({
    patient: patientId,
    status: 'booked'
  });

  if (isCernerEMR()) {
    const now = new Date();
    const formattedDate = now.toISOString(); // This will include the time
    queryParams.append('date', `ge${formattedDate}`);
  }

  const response = await fetch(`${FHIR_BASE_URL}/Appointment?${queryParams.toString()}`, {
    headers: getHeaders(accessToken)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch patient appointments: ${JSON.stringify(errorData)}`);
  }

  return response.json();
};


export const fetchPatientLabReports = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  const response = await fetch(`${FHIR_BASE_URL}/Observation?patient=${patientId}&category=laboratory&_sort=-date`, {
    headers: getHeaders(accessToken)

  });

  if (!response.ok) {
    throw new Error('Failed to fetch patient lab reports');
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : []
  data = data.filter((med: Observation) => med.resourceType === 'Observation');
  return data;
};

export const fetchPatientEncounters = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  const response = await fetch(`${FHIR_BASE_URL}/Encounter?patient=${patientId}&_sort=-date&_count=10`, {
    headers: getHeaders(accessToken)

  });

  if (!response.ok) {
    throw new Error('Failed to fetch patient encounters');
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : []
  data = data.filter((med: Encounter) => med.resourceType === 'Encounter');
  return data;
};

export const fetchPatientProcedures = async (patientId: string, accessToken: string) => {
  const FHIR_BASE_URL = getFhirBaseUrl();
  const response = await fetch(`${FHIR_BASE_URL}/Procedure?patient=${patientId}&_sort=-date&_count=10`, {
    headers: getHeaders(accessToken)

  });

  if (!response.ok) {
    throw new Error('Failed to fetch patient procedures');
  }

  let data = await response.json();
  data = data.entry ? data.entry.map((e: any) => e.resource) : []
  data = data.filter((med: Procedure) => med.resourceType === 'Procedure');
  return data;
};