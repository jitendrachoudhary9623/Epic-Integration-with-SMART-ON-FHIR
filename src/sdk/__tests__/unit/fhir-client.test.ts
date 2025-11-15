/**
 * Unit tests for FHIRClient
 */

import { FHIRClient } from '../../core/fhir-client'
import { SMARTAuthClient } from '../../core/auth-client'
import { emrRegistry } from '../../providers/registry'
import { mockEpicProvider } from '../mocks/providers'
import {
  mockPatient,
  mockPatientBundle,
  mockMedicationBundle,
  mockEmptyBundle,
} from '../mocks/fhir-resources'

describe('FHIRClient', () => {
  let authClient: SMARTAuthClient
  let fhirClient: FHIRClient

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

    // Mock authenticated state
    localStorage.setItem('fhir_sdk_access_token', 'test-access-token')
    localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))
  })

  describe('constructor', () => {
    it('should create client with valid provider', () => {
      expect(fhirClient).toBeInstanceOf(FHIRClient)
      expect(fhirClient.getProvider().id).toBe('epic-test')
    })

    it('should throw error for invalid provider', () => {
      expect(() => {
        new FHIRClient({ providerId: 'invalid-provider', authClient })
      }).toThrow()
    })
  })

  describe('read', () => {
    it('should fetch a single resource by ID', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      const patient = await fhirClient.read('Patient', 'patient-123')

      expect(patient).toEqual(mockPatient)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-epic.com/fhir/r4/Patient/patient-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            Accept: 'application/fhir+json',
          }),
        })
      )
    })

    it('should throw error when not authenticated', async () => {
      localStorage.clear()

      await expect(fhirClient.read('Patient', 'patient-123')).rejects.toThrow(
        'Failed to get access token'
      )
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(fhirClient.read('Patient', 'patient-123')).rejects.toThrow(
        'Network error'
      )
    })

    it('should handle HTTP errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'not-found',
              diagnostics: 'Patient not found',
            },
          ],
        }),
      })

      await expect(fhirClient.read('Patient', 'invalid-id')).rejects.toThrow()
    })
  })

  describe('search', () => {
    it('should search for resources', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMedicationBundle,
      })

      const medications = await fhirClient.search('MedicationRequest', {
        patient: 'patient-123',
        status: 'active',
      })

      expect(medications).toHaveLength(1)
      expect(medications[0]).toEqual(mockMedicationBundle.entry![0].resource)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('MedicationRequest')
      expect(url).toContain('patient=patient-123')
      expect(url).toContain('status=active')
    })

    it('should return empty array for empty bundle', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyBundle,
      })

      const results = await fhirClient.search('MedicationRequest', {
        patient: 'patient-123',
      })

      expect(results).toEqual([])
    })

    it('should handle array parameter values', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyBundle,
      })

      await fhirClient.search('Observation', {
        category: ['vital-signs', 'laboratory'],
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('category=vital-signs')
      expect(url).toContain('category=laboratory')
    })

    it('should skip undefined and null parameters', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyBundle,
      })

      await fhirClient.search('Patient', {
        name: 'John',
        gender: undefined,
        birthdate: null as any,
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('name=John')
      expect(url).not.toContain('gender')
      expect(url).not.toContain('birthdate')
    })
  })

  describe('searchByPatient', () => {
    it('should search resources for a specific patient', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMedicationBundle,
      })

      const medications = await fhirClient.searchByPatient(
        'MedicationRequest',
        'patient-123',
        { status: 'active' }
      )

      expect(medications).toHaveLength(1)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('patient=patient-123')
      expect(url).toContain('status=active')
    })

    it('should add patient parameter automatically', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyBundle,
      })

      await fhirClient.searchByPatient('Observation', 'patient-123')

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('patient=patient-123')
    })
  })

  describe('request interceptors', () => {
    it('should apply request interceptors', async () => {
      const interceptor = jest.fn((url, options) => ({
        url: url + '&custom=param',
        options: {
          ...options,
          headers: {
            ...options.headers,
            'X-Custom-Header': 'test',
          },
        },
      }))

      fhirClient.addRequestInterceptor(interceptor)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      await fhirClient.read('Patient', 'patient-123')

      expect(interceptor).toHaveBeenCalled()
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[0]).toContain('custom=param')
      expect(fetchCall[1].headers['X-Custom-Header']).toBe('test')
    })

    it('should apply multiple interceptors in order', async () => {
      const interceptor1 = jest.fn((url, options) => ({
        url: url + '&param1=value1',
        options,
      }))

      const interceptor2 = jest.fn((url, options) => ({
        url: url + '&param2=value2',
        options,
      }))

      fhirClient.addRequestInterceptor(interceptor1)
      fhirClient.addRequestInterceptor(interceptor2)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      await fhirClient.read('Patient', 'patient-123')

      expect(interceptor1).toHaveBeenCalled()
      expect(interceptor2).toHaveBeenCalled()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[0]).toContain('param1=value1')
      expect(fetchCall[0]).toContain('param2=value2')
    })
  })

  describe('response interceptors', () => {
    it('should apply response interceptors', async () => {
      const interceptor = jest.fn((response, data) => ({
        ...data,
        intercepted: true,
      }))

      fhirClient.addResponseInterceptor(interceptor)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      const result = await fhirClient.read('Patient', 'patient-123')

      expect(interceptor).toHaveBeenCalled()
      expect(result).toHaveProperty('intercepted', true)
    })
  })

  describe('isResourceSupported', () => {
    it('should return true for supported resources', () => {
      expect(fhirClient.isResourceSupported('Patient')).toBe(true)
      expect(fhirClient.isResourceSupported('Observation')).toBe(true)
    })

    it('should return true when no capabilities defined', () => {
      const provider = {
        ...mockEpicProvider,
        capabilities: undefined,
      }
      emrRegistry.registerProvider(provider)

      const client = new FHIRClient({
        providerId: provider.id,
        authClient,
      })

      expect(client.isResourceSupported('AnyResource')).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should call onError callback', async () => {
      const onError = jest.fn()
      const clientWithCallback = new FHIRClient({
        providerId: 'epic-test',
        authClient,
        onError,
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      })

      await expect(
        clientWithCallback.read('Patient', 'invalid-id')
      ).rejects.toThrow()

      expect(onError).toHaveBeenCalled()
    })

    it('should handle JSON parse errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(fhirClient.read('Patient', 'patient-123')).rejects.toThrow(
        'Failed to parse response JSON'
      )
    })
  })

  describe('provider quirks', () => {
    it('should apply custom Accept header', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      await fhirClient.read('Patient', 'patient-123')

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[1].headers.Accept).toBe('application/fhir+json')
    })

    it('should add default status for Epic MedicationRequest', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyBundle,
      })

      await fhirClient.search('MedicationRequest', { patient: 'patient-123' })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('status=active')
    })
  })
})
