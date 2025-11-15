/**
 * Unit tests for PatientService
 */

import { PatientService } from '../../services/patient-service'
import { FHIRClient } from '../../core/fhir-client'
import { SMARTAuthClient } from '../../core/auth-client'
import { emrRegistry } from '../../providers/registry'
import { mockEpicProvider } from '../mocks/providers'
import {
  mockPatient,
  mockMedication,
  mockObservation,
  mockPatientBundle,
  mockMedicationBundle,
  mockObservationBundle,
  mockEmptyBundle,
} from '../mocks/fhir-resources'

describe('PatientService', () => {
  let authClient: SMARTAuthClient
  let fhirClient: FHIRClient
  let patientService: PatientService

  beforeEach(() => {
    emrRegistry.registerProvider(mockEpicProvider)
    localStorage.clear()
    sessionStorage.clear()
    ;(global.fetch as jest.Mock).mockReset()

    authClient = new SMARTAuthClient('epic-test')
    fhirClient = new FHIRClient({
      providerId: 'epic-test',
      authClient,
    })
    patientService = new PatientService(fhirClient)

    // Mock authenticated state
    localStorage.setItem('fhir_sdk_access_token', 'test-access-token')
    localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))
  })

  describe('getPatient', () => {
    it('should fetch patient demographics', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      const patient = await patientService.getPatient('patient-123')

      expect(patient).toEqual(mockPatient)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Patient/patient-123'),
        expect.any(Object)
      )
    })

    it('should handle patient not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      })

      await expect(patientService.getPatient('invalid-id')).rejects.toThrow()
    })
  })

  describe('getMedications', () => {
    it('should fetch patient medications', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMedicationBundle,
      })

      const medications = await patientService.getMedications('patient-123')

      expect(medications).toHaveLength(1)
      expect(medications[0]).toEqual(mockMedication)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('MedicationRequest')
      expect(url).toContain('patient=patient-123')
      expect(url).toContain('status=active')
    })

    it('should accept custom search parameters', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMedicationBundle,
      })

      await patientService.getMedications('patient-123', {
        status: 'completed',
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('status=completed')
    })

    it('should return empty array when no medications found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyBundle,
      })

      const medications = await patientService.getMedications('patient-123')

      expect(medications).toEqual([])
    })
  })

  describe('getVitals', () => {
    it('should fetch patient vital signs', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockObservationBundle,
      })

      const vitals = await patientService.getVitals('patient-123')

      expect(vitals).toHaveLength(1)
      expect(vitals[0]).toEqual(mockObservation)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('Observation')
      expect(url).toContain('patient=patient-123')
      expect(url).toContain('category=vital-signs')
      expect(url).toContain('_sort=-date')
    })

    it('should accept custom options', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockObservationBundle,
      })

      await patientService.getVitals('patient-123', {
        category: 'blood-pressure',
        sort: 'date',
        date: 'gt2024-01-01',
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('category=blood-pressure')
      expect(url).toContain('_sort=date')
      expect(url).toContain('date=gt2024-01-01')
    })
  })

  describe('getLabReports', () => {
    it('should fetch patient lab reports', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockObservationBundle,
      })

      const labReports = await patientService.getLabReports('patient-123')

      expect(labReports).toHaveLength(1)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('category=laboratory')
    })

    it('should accept custom options', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockObservationBundle,
      })

      await patientService.getLabReports('patient-123', {
        date: 'ge2024-01-01',
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('date=ge2024-01-01')
    })
  })

  describe('getAppointments', () => {
    it('should fetch patient appointments', async () => {
      const mockAppointmentBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Appointment',
              id: 'appt-123',
              status: 'booked',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointmentBundle,
      })

      const appointments = await patientService.getAppointments('patient-123')

      expect(appointments).toHaveLength(1)
      expect(appointments[0].id).toBe('appt-123')

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('Appointment')
      expect(url).toContain('status=booked')
    })
  })

  describe('getEncounters', () => {
    it('should fetch patient encounters', async () => {
      const mockEncounterBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Encounter',
              id: 'enc-123',
              status: 'finished',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEncounterBundle,
      })

      const encounters = await patientService.getEncounters('patient-123')

      expect(encounters).toHaveLength(1)
      expect(encounters[0].id).toBe('enc-123')
    })
  })

  describe('getProcedures', () => {
    it('should fetch patient procedures', async () => {
      const mockProcedureBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Procedure',
              id: 'proc-123',
              status: 'completed',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProcedureBundle,
      })

      const procedures = await patientService.getProcedures('patient-123')

      expect(procedures).toHaveLength(1)
      expect(procedures[0].id).toBe('proc-123')
    })
  })

  describe('getAllPatientData', () => {
    it('should fetch all patient data in parallel', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPatient,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMedicationBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockObservationBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockObservationBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })

      const data = await patientService.getAllPatientData('patient-123')

      expect(data.patient).toEqual(mockPatient)
      expect(data.medications).toHaveLength(1)
      expect(data.vitals).toHaveLength(1)
      expect(data.labReports).toHaveLength(1)
      expect(data.appointments).toHaveLength(0)
      expect(data.encounters).toHaveLength(0)
      expect(data.procedures).toHaveLength(0)
      expect(data.errors).toEqual({})

      // Verify all 7 requests were made
      expect(global.fetch).toHaveBeenCalledTimes(7)
    })

    it('should handle errors gracefully and continue fetching other data', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPatient,
        })
        .mockRejectedValueOnce(new Error('Medication fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockObservationBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockObservationBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })

      const data = await patientService.getAllPatientData('patient-123')

      expect(data.patient).toEqual(mockPatient)
      expect(data.medications).toEqual([])
      expect(data.vitals).toHaveLength(1)
      expect(data.errors.medications).toContain('Medication fetch failed')
    })

    it('should handle patient fetch error', async () => {
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Patient not found'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMedicationBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyBundle,
        })

      const data = await patientService.getAllPatientData('patient-123')

      expect(data.patient).toBeNull()
      expect(data.medications).toHaveLength(1)
      expect(data.errors.patient).toContain('Patient not found')
    })

    it('should return all errors when all requests fail', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const data = await patientService.getAllPatientData('patient-123')

      expect(data.patient).toBeNull()
      expect(data.medications).toEqual([])
      expect(data.vitals).toEqual([])
      expect(data.labReports).toEqual([])
      expect(data.appointments).toEqual([])
      expect(data.encounters).toEqual([])
      expect(data.procedures).toEqual([])

      expect(Object.keys(data.errors)).toHaveLength(7)
      expect(data.errors.patient).toContain('Network error')
      expect(data.errors.medications).toContain('Network error')
    })
  })
})
