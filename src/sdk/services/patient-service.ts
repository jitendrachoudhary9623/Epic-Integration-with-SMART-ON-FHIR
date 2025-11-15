/**
 * Patient Service
 * High-level service for patient-related FHIR operations
 */

import type {
  Patient,
  MedicationRequest,
  Observation,
  Appointment,
  Encounter,
  Procedure,
  SearchParams,
} from '../types';
import { FHIRClient } from '../core';

export interface VitalsOptions {
  category?: string;
  date?: string;
  sort?: string;
}

export interface LabReportsOptions {
  category?: string;
  date?: string;
  sort?: string;
}

export class PatientService {
  constructor(private fhirClient: FHIRClient) {}

  /**
   * Get patient demographics
   */
  async getPatient(patientId: string): Promise<Patient> {
    return this.fhirClient.read<Patient>('Patient', patientId);
  }

  /**
   * Get patient medications
   */
  async getMedications(
    patientId: string,
    options: SearchParams = {}
  ): Promise<MedicationRequest[]> {
    return this.fhirClient.searchByPatient<MedicationRequest>(
      'MedicationRequest',
      patientId,
      {
        status: 'active',
        ...options,
      }
    );
  }

  /**
   * Get patient vital signs
   */
  async getVitals(
    patientId: string,
    options: VitalsOptions = {}
  ): Promise<Observation[]> {
    return this.fhirClient.searchByPatient<Observation>(
      'Observation',
      patientId,
      {
        category: options.category || 'vital-signs',
        _sort: options.sort || '-date',
        date: options.date,
      }
    );
  }

  /**
   * Get patient lab reports
   */
  async getLabReports(
    patientId: string,
    options: LabReportsOptions = {}
  ): Promise<Observation[]> {
    return this.fhirClient.searchByPatient<Observation>(
      'Observation',
      patientId,
      {
        category: options.category || 'laboratory',
        _sort: options.sort || '-date',
        date: options.date,
      }
    );
  }

  /**
   * Get patient appointments
   */
  async getAppointments(
    patientId: string,
    options: SearchParams = {}
  ): Promise<Appointment[]> {
    return this.fhirClient.searchByPatient<Appointment>(
      'Appointment',
      patientId,
      {
        status: 'booked',
        ...options,
      }
    );
  }

  /**
   * Get patient encounters
   */
  async getEncounters(
    patientId: string,
    options: SearchParams = {}
  ): Promise<Encounter[]> {
    return this.fhirClient.searchByPatient<Encounter>(
      'Encounter',
      patientId,
      options
    );
  }

  /**
   * Get patient procedures
   */
  async getProcedures(
    patientId: string,
    options: SearchParams = {}
  ): Promise<Procedure[]> {
    return this.fhirClient.searchByPatient<Procedure>(
      'Procedure',
      patientId,
      options
    );
  }

  /**
   * Get all patient data at once
   */
  async getAllPatientData(patientId: string): Promise<{
    patient: Patient | null;
    medications: MedicationRequest[];
    vitals: Observation[];
    labReports: Observation[];
    appointments: Appointment[];
    encounters: Encounter[];
    procedures: Procedure[];
    errors: Record<string, string>;
  }> {
    const errors: Record<string, string> = {};

    // Fetch all data in parallel with error handling
    const [
      patient,
      medications,
      vitals,
      labReports,
      appointments,
      encounters,
      procedures,
    ] = await Promise.all([
      this.getPatient(patientId).catch((e) => {
        errors.patient = e.message;
        return null;
      }),
      this.getMedications(patientId).catch((e) => {
        errors.medications = e.message;
        return [];
      }),
      this.getVitals(patientId).catch((e) => {
        errors.vitals = e.message;
        return [];
      }),
      this.getLabReports(patientId).catch((e) => {
        errors.labReports = e.message;
        return [];
      }),
      this.getAppointments(patientId).catch((e) => {
        errors.appointments = e.message;
        return [];
      }),
      this.getEncounters(patientId).catch((e) => {
        errors.encounters = e.message;
        return [];
      }),
      this.getProcedures(patientId).catch((e) => {
        errors.procedures = e.message;
        return [];
      }),
    ]);

    return {
      patient,
      medications,
      vitals,
      labReports,
      appointments,
      encounters,
      procedures,
      errors,
    };
  }
}
