import { useState, useEffect } from 'react';
import { fetchPatientData, fetchPatientAppointments, fetchPatientMedications, fetchPatientVitals, fetchPatientLabReports, fetchPatientEncounters, fetchPatientProcedures } from '@/lib/api';
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
    const accessToken = localStorage.getItem('access_token') || '';
    const patientId = localStorage.getItem('patient') || '';

    const fetchData = async () => {
      try {
        const [patientData, appointmentsData, medicationsData, vitalsData, labReportsData, encountersData, procedureData] = await Promise.all([
          fetchPatientData(patientId, accessToken),
          fetchPatientAppointments(patientId, accessToken),
          fetchPatientMedications(patientId, accessToken),
          fetchPatientVitals(patientId, accessToken),
          fetchPatientLabReports(patientId, accessToken),
          fetchPatientEncounters(patientId, accessToken),
          fetchPatientProcedures(patientId, accessToken)
        ]);

        console.log({
          patientData,
            procedureData
        })
        setPatient(patientData as Patient);
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