import { Encounter, Medication, MedicationRequest, Observation, Procedure } from "fhir/r4";

const FHIR_BASE_URL = process.env.NEXT_PUBLIC_FHIR_BASE_URL || '';


export const fetchPatientData = async (patientId: string, accessToken: string) => {
  const response = await fetch(`${FHIR_BASE_URL}/Patient/${patientId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/fhir+json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch patient data');
  }

  return response.json();
};

export const fetchPatientMedications = async (patientId: string, accessToken: string) => {
    const response = await fetch(`${FHIR_BASE_URL}/MedicationRequest?subject=${patientId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch patient medications');
    }
  
    let data = await response.json();
    data = data.entry ? data.entry.map((e: any) => e.resource) : []
    data = data.filter((med: MedicationRequest) => med.resourceType === 'MedicationRequest');
    return data;
  };
  
  export const fetchPatientVitals = async (patientId: string, accessToken: string) => {
    const response = await fetch(`${FHIR_BASE_URL}/Observation?patient=${patientId}&category=vital-signs&_sort=-date`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
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
  const response = await fetch(`${FHIR_BASE_URL}/Appointment?patient=${patientId}&status=booked`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/fhir+json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch patient appointments');
  }

  return response.json();
};

// Add more API functions as needed for your application
export const fetchPatientLabReports = async (patientId: string, accessToken: string) => {
    const response = await fetch(`${FHIR_BASE_URL}/Observation?patient=${patientId}&category=laboratory&_sort=-date`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
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
    const response = await fetch(`${FHIR_BASE_URL}/Encounter?patient=${patientId}&_sort=-date&_count=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
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
    const response = await fetch(`${FHIR_BASE_URL}/Procedure?patient=${patientId}&_sort=-date&_count=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch patient procedures');
    }
  
    let data = await response.json();
    data = data.entry ? data.entry.map((e: any) => e.resource) : []
    data = data.filter((med: Procedure) => med.resourceType === 'Procedure');
    return data;
  }