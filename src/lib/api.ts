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
    const response = await fetch(`${FHIR_BASE_URL}/MedicationRequest?patient=${patientId}&status=active&_sort=-date&_count=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch patient medications');
    }
  
    const data = await response.json();
    return data.entry ? data.entry.map((e: any) => e.resource) : [];
  };
  
  export const fetchPatientVitals = async (patientId: string, accessToken: string) => {
    const response = await fetch(`${FHIR_BASE_URL}/Observation?patient=${patientId}&category=vital-signs&_sort=-date&_count=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch patient vitals');
    }
  
    const data = await response.json();
    return data.entry ? data.entry.map((e: any) => e.resource) : [];
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
    const response = await fetch(`${FHIR_BASE_URL}/Observation?patient=${patientId}&category=laboratory&_sort=-date&_count=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch patient lab reports');
    }
  
    const data = await response.json();
    return data.entry ? data.entry.map((e: any) => e.resource) : [];
  };