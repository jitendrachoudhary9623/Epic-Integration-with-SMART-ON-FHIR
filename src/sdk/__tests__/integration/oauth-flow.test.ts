/**
 * Integration tests for OAuth flow
 */

import { SMARTAuthClient } from '../../core/auth-client'
import { FHIRClient } from '../../core/fhir-client'
import { PatientService } from '../../services/patient-service'
import { emrRegistry } from '../../providers/registry'
import { mockEpicProvider } from '../mocks/providers'
import { mockPatient, mockMedicationBundle, mockObservationBundle } from '../mocks/fhir-resources'
import type { TokenResponse } from '../../types'

describe('OAuth Flow Integration', () => {
  beforeEach(() => {
    emrRegistry.registerProvider(mockEpicProvider)
    localStorage.clear()
    sessionStorage.clear()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Complete OAuth flow', () => {
    it('should complete full OAuth flow from authorization to data fetch', async () => {
      // Step 1: Create auth client and generate authorization URL
      const authClient = new SMARTAuthClient('epic-test')
      const authUrl = await authClient.authorize()

      expect(authUrl).toContain('response_type=code')
      expect(authUrl).toContain('code_challenge=')

      // Verify state and code verifier are stored
      const state = sessionStorage.getItem('fhir_sdk_auth_state')
      const codeVerifier = sessionStorage.getItem('fhir_sdk_auth_code_verifier')
      expect(state).toBeTruthy()
      expect(codeVerifier).toBeTruthy()

      // Step 2: Simulate callback with authorization code
      const mockTokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        patient: 'patient-123',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })

      const callbackUrl = `http://localhost:3000/callback?code=auth-code&state=${state}`
      const tokens = await authClient.handleCallback(callbackUrl)

      expect(tokens.access_token).toBe('test-access-token')
      expect(await authClient.isAuthenticated()).toBe(true)
      expect(await authClient.getPatientId()).toBe('patient-123')

      // Step 3: Create FHIR client and fetch data
      const fhirClient = new FHIRClient({
        providerId: 'epic-test',
        authClient,
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      const patient = await fhirClient.read('Patient', 'patient-123')
      expect(patient).toEqual(mockPatient)

      // Step 4: Use patient service
      const patientService = new PatientService(fhirClient)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMedicationBundle,
      })

      const medications = await patientService.getMedications('patient-123')
      expect(medications).toHaveLength(1)

      // Verify all requests used the access token
      const fetchCalls = (global.fetch as jest.Mock).mock.calls
      fetchCalls.slice(1).forEach(call => {
        const headers = call[1]?.headers
        expect(headers?.Authorization).toBe('Bearer test-access-token')
      })
    })

    it('should handle OAuth errors gracefully', async () => {
      const authClient = new SMARTAuthClient('epic-test')
      await authClient.authorize()

      const errorUrl = 'http://localhost:3000/callback?error=access_denied&error_description=User+denied'

      await expect(authClient.handleCallback(errorUrl)).rejects.toThrow(
        'Authorization failed: access_denied'
      )

      expect(await authClient.isAuthenticated()).toBe(false)
    })

    it('should prevent CSRF attacks with state validation', async () => {
      const authClient = new SMARTAuthClient('epic-test')
      await authClient.authorize()

      // Attacker tries to use different state
      const callbackUrl = 'http://localhost:3000/callback?code=auth-code&state=malicious-state'

      await expect(authClient.handleCallback(callbackUrl)).rejects.toThrow('State mismatch')
    })
  })

  describe('Token refresh flow', () => {
    it('should refresh expired token automatically', async () => {
      const authClient = new SMARTAuthClient('epic-test')

      // Set up expired token
      localStorage.setItem('fhir_sdk_access_token', 'old-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() - 1000))
      localStorage.setItem('fhir_sdk_refresh_token', 'refresh-token')
      localStorage.setItem('fhir_sdk_patient_id', 'patient-123')

      // Mock token refresh
      const newTokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPatient,
        })

      // Create FHIR client
      const fhirClient = new FHIRClient({
        providerId: 'epic-test',
        authClient,
        autoRefreshToken: true,
      })

      // Fetch data - should trigger token refresh
      const patient = await fhirClient.read('Patient', 'patient-123')

      expect(patient).toEqual(mockPatient)
      expect(localStorage.getItem('fhir_sdk_access_token')).toBe('new-access-token')

      // Verify refresh token request was made
      const refreshCall = (global.fetch as jest.Mock).mock.calls[0]
      const refreshBody = refreshCall[1]?.body?.toString()
      expect(refreshBody).toContain('grant_type=refresh_token')
      expect(refreshBody).toContain('refresh_token=refresh-token')
    })

    it('should fail gracefully when refresh token is invalid', async () => {
      const authClient = new SMARTAuthClient('epic-test')

      localStorage.setItem('fhir_sdk_access_token', 'old-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() - 1000))
      localStorage.setItem('fhir_sdk_refresh_token', 'invalid-refresh-token')

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid refresh token',
      })

      await expect(authClient.getAccessToken()).rejects.toThrow('Token refresh failed')
    })
  })

  describe('End-to-end patient data flow', () => {
    it('should fetch all patient data after authentication', async () => {
      // Authenticate
      const authClient = new SMARTAuthClient('epic-test')
      await authClient.authorize()

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

      const state = sessionStorage.getItem('fhir_sdk_auth_state')!
      await authClient.handleCallback(
        `http://localhost:3000/callback?code=auth-code&state=${state}`
      )

      // Create service
      const fhirClient = new FHIRClient({
        providerId: 'epic-test',
        authClient,
      })
      const patientService = new PatientService(fhirClient)

      // Mock all data responses
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
          json: async () => ({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] }),
        })

      // Fetch all data
      const allData = await patientService.getAllPatientData('patient-123')

      expect(allData.patient?.id).toBe('patient-123')
      expect(allData.medications).toHaveLength(1)
      expect(allData.vitals).toHaveLength(1)
      expect(allData.labReports).toHaveLength(1)
      expect(Object.keys(allData.errors)).toHaveLength(0)
    })
  })

  describe('Session management', () => {
    it('should maintain session across page reloads', async () => {
      // Initial authentication
      const authClient1 = new SMARTAuthClient('epic-test')

      localStorage.setItem('fhir_sdk_access_token', 'persisted-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))
      localStorage.setItem('fhir_sdk_patient_id', 'patient-123')

      expect(await authClient1.isAuthenticated()).toBe(true)
      expect(await authClient1.getPatientId()).toBe('patient-123')

      // Simulate page reload - create new client instance
      const authClient2 = new SMARTAuthClient('epic-test')

      expect(await authClient2.isAuthenticated()).toBe(true)
      expect(await authClient2.getPatientId()).toBe('patient-123')

      // Should be able to fetch data
      const fhirClient = new FHIRClient({
        providerId: 'epic-test',
        authClient: authClient2,
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      const patient = await fhirClient.read('Patient', 'patient-123')
      expect(patient).toEqual(mockPatient)
    })

    it('should clear session on logout', async () => {
      const authClient = new SMARTAuthClient('epic-test')

      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_patient_id', 'patient-123')

      expect(await authClient.isAuthenticated()).toBe(true)

      await authClient.logout()

      expect(await authClient.isAuthenticated()).toBe(false)
      expect(await authClient.getPatientId()).toBeNull()
      expect(localStorage.getItem('fhir_sdk_access_token')).toBeNull()
    })
  })
})
