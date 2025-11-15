/**
 * Mock FHIR resources for testing
 */

import type { Patient, MedicationRequest, Observation, Bundle } from '../../types'

export const mockPatient: Patient = {
  resourceType: 'Patient',
  id: 'patient-123',
  name: [
    {
      given: ['John'],
      family: 'Doe',
      use: 'official',
    },
  ],
  gender: 'male',
  birthDate: '1980-01-01',
  telecom: [
    {
      system: 'phone',
      value: '555-1234',
      use: 'home',
    },
  ],
}

export const mockMedication: MedicationRequest = {
  resourceType: 'MedicationRequest',
  id: 'med-123',
  status: 'active',
  intent: 'order',
  subject: {
    reference: 'Patient/patient-123',
  },
  medicationCodeableConcept: {
    text: 'Aspirin 81mg',
    coding: [
      {
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '1191',
        display: 'Aspirin',
      },
    ],
  },
}

export const mockObservation: Observation = {
  resourceType: 'Observation',
  id: 'obs-123',
  status: 'final',
  category: [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs',
        },
      ],
    },
  ],
  code: {
    coding: [
      {
        system: 'http://loinc.org',
        code: '8867-4',
        display: 'Heart rate',
      },
    ],
    text: 'Heart rate',
  },
  subject: {
    reference: 'Patient/patient-123',
  },
  valueQuantity: {
    value: 72,
    unit: 'beats/minute',
    system: 'http://unitsofmeasure.org',
    code: '/min',
  },
}

export const mockPatientBundle: Bundle<Patient> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 1,
  entry: [
    {
      resource: mockPatient,
    },
  ],
}

export const mockMedicationBundle: Bundle<MedicationRequest> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 1,
  entry: [
    {
      resource: mockMedication,
    },
  ],
}

export const mockObservationBundle: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 1,
  entry: [
    {
      resource: mockObservation,
    },
  ],
}

export const mockEmptyBundle: Bundle<any> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 0,
  entry: [],
}
