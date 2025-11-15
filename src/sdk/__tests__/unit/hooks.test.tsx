/**
 * Unit tests for React hooks
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import {
  useAuth,
  useFHIRClient,
  usePatientService,
  usePatientData,
  useFHIR,
} from '../../hooks/useFHIRSDK'
import { emrRegistry } from '../../providers/registry'
import { mockEpicProvider } from '../mocks/providers'
import {
  mockPatient,
  mockMedicationBundle,
  mockObservationBundle,
  mockEmptyBundle,
} from '../mocks/fhir-resources'
import type { TokenResponse } from '../../types'

describe('React Hooks', () => {
  beforeEach(() => {
    emrRegistry.registerProvider(mockEpicProvider)
    localStorage.clear()
    sessionStorage.clear()
    ;(global.fetch as jest.Mock).mockReset()

    // Mock window.location.href
    delete (window as any).location
    ;(window as any).location = { href: '' }
  })

  describe('useAuth', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth('epic-test'))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.patientId).toBeNull()
    })

    it('should check authentication on mount', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))
      localStorage.setItem('fhir_sdk_patient_id', 'patient-123')

      const { result } = renderHook(() => useAuth('epic-test'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.patientId).toBe('patient-123')
    })

    it('should handle login', async () => {
      const { result } = renderHook(() => useAuth('epic-test'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login()
      })

      expect(window.location.href).toContain('authorize')
    })

    it('should handle callback successfully', async () => {
      const { result } = renderHook(() => useAuth('epic-test'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Setup authorization
      await act(async () => {
        await result.current.authClient.authorize()
      })

      const state = sessionStorage.getItem('fhir_sdk_auth_state')!

      const mockTokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: 'patient-123',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })

      const callbackUrl = `http://localhost:3000/callback?code=test-code&state=${state}`

      await act(async () => {
        await result.current.handleCallback(callbackUrl)
      })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.patientId).toBe('patient-123')
      })
    })

    it('should handle logout', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_patient_id', 'patient-123')

      const { result } = renderHook(() => useAuth('epic-test'))

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.patientId).toBeNull()
    })

    it('should recreate client when providerId changes', () => {
      const { result, rerender } = renderHook(
        ({ providerId }) => useAuth(providerId),
        { initialProps: { providerId: 'epic-test' } }
      )

      const firstClient = result.current.authClient

      rerender({ providerId: 'cerner-test' })

      const secondClient = result.current.authClient

      expect(firstClient).not.toBe(secondClient)
    })
  })

  describe('useFHIRClient', () => {
    it('should create FHIR client', async () => {
      const { result: authResult } = renderHook(() => useAuth('epic-test'))

      await waitFor(() => {
        expect(authResult.current.isLoading).toBe(false)
      })

      const { result: clientResult } = renderHook(() =>
        useFHIRClient('epic-test', authResult.current.authClient)
      )

      expect(clientResult.current).toBeDefined()
      expect(clientResult.current.getProvider().id).toBe('epic-test')
    })

    it('should memoize client', () => {
      const { result: authResult } = renderHook(() => useAuth('epic-test'))

      const { result: clientResult, rerender } = renderHook(() =>
        useFHIRClient('epic-test', authResult.current.authClient)
      )

      const firstClient = clientResult.current

      rerender()

      expect(clientResult.current).toBe(firstClient)
    })
  })

  describe('usePatientService', () => {
    it('should create patient service', async () => {
      const { result: authResult } = renderHook(() => useAuth('epic-test'))

      await waitFor(() => {
        expect(authResult.current.isLoading).toBe(false)
      })

      const { result: clientResult } = renderHook(() =>
        useFHIRClient('epic-test', authResult.current.authClient)
      )

      const { result: serviceResult } = renderHook(() =>
        usePatientService(clientResult.current)
      )

      expect(serviceResult.current).toBeDefined()
    })

    it('should memoize service', async () => {
      const { result: authResult } = renderHook(() => useAuth('epic-test'))

      await waitFor(() => {
        expect(authResult.current.isLoading).toBe(false)
      })

      const { result: clientResult } = renderHook(() =>
        useFHIRClient('epic-test', authResult.current.authClient)
      )

      const { result: serviceResult, rerender } = renderHook(() =>
        usePatientService(clientResult.current)
      )

      const firstService = serviceResult.current

      rerender()

      expect(serviceResult.current).toBe(firstService)
    })
  })

  describe('usePatientData', () => {
    it('should not fetch when patientId is null', () => {
      const { result: authResult } = renderHook(() => useAuth('epic-test'))
      const { result: clientResult } = renderHook(() =>
        useFHIRClient('epic-test', authResult.current.authClient)
      )
      const { result: serviceResult } = renderHook(() =>
        usePatientService(clientResult.current)
      )

      const { result } = renderHook(() =>
        usePatientData(null, serviceResult.current)
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.patient).toBeNull()
    })

    it('should fetch patient data when patientId is provided', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))

      const { result: authResult } = renderHook(() => useAuth('epic-test'))
      const { result: clientResult } = renderHook(() =>
        useFHIRClient('epic-test', authResult.current.authClient)
      )
      const { result: serviceResult } = renderHook(() =>
        usePatientService(clientResult.current)
      )

      // Mock API responses
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockPatient })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMedicationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })

      const { result } = renderHook(() =>
        usePatientData('patient-123', serviceResult.current)
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.patient?.id).toBe('patient-123')
      expect(result.current.medications).toHaveLength(1)
      expect(result.current.vitals).toHaveLength(1)
    })

    it('should support refetch', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))

      const { result: authResult } = renderHook(() => useAuth('epic-test'))
      const { result: clientResult } = renderHook(() =>
        useFHIRClient('epic-test', authResult.current.authClient)
      )
      const { result: serviceResult } = renderHook(() =>
        usePatientService(clientResult.current)
      )

      // Mock first fetch
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockPatient })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMedicationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })

      const { result } = renderHook(() =>
        usePatientData('patient-123', serviceResult.current)
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock refetch
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockPatient })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMedicationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })

      await act(async () => {
        await result.current.refetch()
      })

      expect(global.fetch).toHaveBeenCalledTimes(14) // 7 initial + 7 refetch
    })

    it('should handle fetch errors gracefully', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))

      const { result: authResult } = renderHook(() => useAuth('epic-test'))
      const { result: clientResult } = renderHook(() =>
        useFHIRClient('epic-test', authResult.current.authClient)
      )
      const { result: serviceResult } = renderHook(() =>
        usePatientService(clientResult.current)
      )

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        usePatientData('patient-123', serviceResult.current)
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.errors.general).toBeDefined()
    })
  })

  describe('useFHIR (all-in-one hook)', () => {
    it('should provide all functionality in one hook', async () => {
      const { result } = renderHook(() => useFHIR('epic-test'))

      await waitFor(() => {
        expect(result.current.isAuthLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.fhirClient).toBeDefined()
      expect(result.current.patientService).toBeDefined()
      expect(result.current.patient).toBeNull()
      expect(result.current.login).toBeInstanceOf(Function)
      expect(result.current.logout).toBeInstanceOf(Function)
      expect(result.current.refetch).toBeInstanceOf(Function)
    })

    it('should fetch data when authenticated', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))
      localStorage.setItem('fhir_sdk_patient_id', 'patient-123')

      // Mock API responses
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockPatient })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMedicationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })

      const { result } = renderHook(() => useFHIR('epic-test'))

      await waitFor(() => {
        expect(result.current.isAuthLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.patientId).toBe('patient-123')

      await waitFor(() => {
        expect(result.current.isDataLoading).toBe(false)
      })

      expect(result.current.patient?.id).toBe('patient-123')
      expect(result.current.medications).toHaveLength(1)
      expect(result.current.vitals).toHaveLength(1)
    })

    it('should handle complete OAuth flow', async () => {
      const { result } = renderHook(() => useFHIR('epic-test'))

      await waitFor(() => {
        expect(result.current.isAuthLoading).toBe(false)
      })

      // Start login
      await act(async () => {
        await result.current.login()
      })

      expect(window.location.href).toContain('authorize')

      // Handle callback
      const state = sessionStorage.getItem('fhir_sdk_auth_state')!

      const mockTokenResponse: TokenResponse = {
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: 'patient-456',
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTokenResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPatient })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMedicationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockObservationBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyBundle })

      await act(async () => {
        await result.current.handleCallback(
          `http://localhost:3000/callback?code=test-code&state=${state}`
        )
      })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.patientId).toBe('patient-456')
      })

      await waitFor(() => {
        expect(result.current.isDataLoading).toBe(false)
      })

      expect(result.current.patient).toBeDefined()
    })
  })
})
