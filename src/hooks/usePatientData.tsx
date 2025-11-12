import { useState, useEffect } from 'react';
import { fetchPatientData, fetchPatientAppointments, fetchPatientMedications, fetchPatientVitals, fetchPatientLabReports, fetchPatientEncounters, fetchPatientProcedures, getPatientIdFromToken } from '@/lib/api';
import { Procedure } from 'fhir/r4';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface Patient {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
  emergencyContact: EmergencyContact;
}

interface Appointment {
  id: string;
  date: string;
  provider: string;
  reason: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

interface Vital {
  id: string;
  date: string;
  type: string;
  value: string;
}

interface LabReport {
  id: string;
  date: string;
  name: string;
  result: string;
}

interface Encounter {
    id: string;
    status: string;
    class: {
      display: string;
    };
    type: Array<{
      text: string;
    }>;
    subject: {
      reference: string;
    };
    participant: Array<{
      individual: {
        display: string;
      };
    }>;
    period: {
      start: string;
      end?: string;
    };
    location: Array<{
      location: {
        display: string;
      };
    }>;
    reasonCode: Array<{
      text: string;
    }>;
  }

export const usePatientData = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const accessToken = localStorage.getItem('access_token') || '';

      // Validate we have required data
      if (!accessToken) {
        console.error('No access token found');
        setIsLoading(false);
        return;
      }

      // Try to get patient ID from various sources
      let patientId = await getPatientIdFromToken();

      console.log('usePatientData - patientId:', patientId, 'accessToken:', accessToken ? 'present' : 'missing');

      if (!patientId) {
        console.error('No patient ID found - tried localStorage and id_token');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch patient data first (required)
        const patientData = await fetchPatientData(patientId, accessToken);
        setPatient(patientData as Patient);

        // Fetch other resources with error handling for each
        const fetchWithErrorHandling = async <T,>(
          fetchFn: () => Promise<T>,
          resourceName: string,
          defaultValue: T
        ): Promise<T> => {
          try {
            return await fetchFn();
          } catch (error) {
            console.warn(`Failed to fetch ${resourceName} (this may be expected for Athena):`, error);
            return defaultValue;
          }
        };

        const [
          appointmentsData,
          medicationsData,
          vitalsData,
          labReportsData,
          encountersData,
          procedureData
        ] = await Promise.all([
          fetchWithErrorHandling(
            () => fetchPatientAppointments(patientId, accessToken),
            'appointments',
            []
          ),
          fetchWithErrorHandling(
            () => fetchPatientMedications(patientId, accessToken),
            'medications',
            []
          ),
          fetchWithErrorHandling(
            () => fetchPatientVitals(patientId, accessToken),
            'vitals',
            []
          ),
          fetchWithErrorHandling(
            () => fetchPatientLabReports(patientId, accessToken),
            'lab reports',
            []
          ),
          fetchWithErrorHandling(
            () => fetchPatientEncounters(patientId, accessToken),
            'encounters',
            []
          ),
          fetchWithErrorHandling(
            () => fetchPatientProcedures(patientId, accessToken),
            'procedures',
            []
          )
        ]);

        console.log('Fetched data:', {
          patientData,
          appointmentsCount: Array.isArray(appointmentsData) ? appointmentsData.length : 0,
          medicationsCount: Array.isArray(medicationsData) ? medicationsData.length : 0,
          vitalsCount: Array.isArray(vitalsData) ? vitalsData.length : 0,
          labReportsCount: Array.isArray(labReportsData) ? labReportsData.length : 0,
          encountersCount: Array.isArray(encountersData) ? encountersData.length : 0,
          proceduresCount: Array.isArray(procedureData) ? procedureData.length : 0
        });

        setAppointments(appointmentsData as Appointment[]);
        setMedications(medicationsData as Medication[]);
        setVitals(vitalsData as Vital[]);
        setLabReports(labReportsData as LabReport[]);
        setEncounters(encountersData as Encounter[]);
        setProcedures(procedureData as Procedure[]);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { patient, appointments, medications, vitals, labReports, isLoading, encounters, procedures };
};