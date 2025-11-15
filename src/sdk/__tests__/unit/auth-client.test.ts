/**
 * Unit tests for SMARTAuthClient
 */

import { SMARTAuthClient } from '../../core/auth-client'
import { emrRegistry } from '../../providers/registry'
import { mockEpicProvider, mockCernerProvider } from '../mocks/providers'
import type { TokenResponse } from '../../types'

describe('SMARTAuthClient', () => {
  beforeEach(() => {
    // Register test providers
    emrRegistry.registerProvider(mockEpicProvider)
    emrRegistry.registerProvider(mockCernerProvider)

    // Clear storage
    localStorage.clear()
    sessionStorage.clear()

    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('constructor', () => {
    it('should create client with valid provider', () => {
      const client = new SMARTAuthClient('epic-test')

      expect(client).toBeInstanceOf(SMARTAuthClient)
      expect(client.getProvider().id).toBe('epic-test')
    })

    it('should throw error for invalid provider', () => {
      expect(() => {
        new SMARTAuthClient('invalid-provider')
      }).toThrow()
    })
  })

  describe('authorize', () => {
    it('should generate authorization URL with PKCE', async () => {
      const client = new SMARTAuthClient('epic-test')

      const authUrl = await client.authorize()

      expect(authUrl).toContain(mockEpicProvider.authUrl)
      expect(authUrl).toContain('client_id=' + mockEpicProvider.clientId)
      expect(authUrl).toContain('redirect_uri=')
      expect(authUrl).toContain('response_type=code')
      expect(authUrl).toContain('scope=')
      expect(authUrl).toContain('state=')
      expect(authUrl).toContain('code_challenge=')
      expect(authUrl).toContain('code_challenge_method=S256')
      expect(authUrl).toContain('aud=' + encodeURIComponent(mockEpicProvider.fhirBaseUrl))
    })

    it('should generate authorization URL without PKCE', async () => {
      const client = new SMARTAuthClient('cerner-test')

      const authUrl = await client.authorize()

      expect(authUrl).toContain(mockCernerProvider.authUrl)
      expect(authUrl).not.toContain('code_challenge=')
      expect(authUrl).not.toContain('code_challenge_method=')
    })

    it('should store state in session storage', async () => {
      const client = new SMARTAuthClient('epic-test')

      await client.authorize()

      const stateKey = Object.keys(sessionStorage).find(k => k.includes('state'))
      expect(stateKey).toBeDefined()
      expect(sessionStorage.getItem(stateKey!)).toBeTruthy()
    })

    it('should store code verifier for PKCE flow', async () => {
      const client = new SMARTAuthClient('epic-test')

      await client.authorize()

      const verifierKey = Object.keys(sessionStorage).find(k => k.includes('code_verifier'))
      expect(verifierKey).toBeDefined()
    })

    it('should store provider ID', async () => {
      const client = new SMARTAuthClient('epic-test')

      await client.authorize()

      const providerKey = Object.keys(sessionStorage).find(k => k.includes('provider_id'))
      expect(providerKey).toBeDefined()
      expect(sessionStorage.getItem(providerKey!)).toBe('epic-test')
    })
  })

  describe('handleCallback', () => {
    let client: SMARTAuthClient

    beforeEach(() => {
      client = new SMARTAuthClient('epic-test')
    })

    it('should exchange code for tokens successfully', async () => {
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

      // Set up auth state
      await client.authorize()
      const state = sessionStorage.getItem('fhir_sdk_auth_state')!

      const callbackUrl = `http://localhost:3000/callback?code=test-code&state=${state}`
      const response = await client.handleCallback(callbackUrl)

      expect(response).toEqual(mockTokenResponse)
      expect(await client.isAuthenticated()).toBe(true)
    })

    it('should throw error for missing code', async () => {
      await client.authorize()
      const state = sessionStorage.getItem('fhir_sdk_auth_state')!

      const callbackUrl = `http://localhost:3000/callback?state=${state}`

      await expect(client.handleCallback(callbackUrl)).rejects.toThrow(
        'Authorization code not found'
      )
    })

    it('should throw error for missing state', async () => {
      const callbackUrl = 'http://localhost:3000/callback?code=test-code'

      await expect(client.handleCallback(callbackUrl)).rejects.toThrow(
        'State parameter not found'
      )
    })

    it('should throw error for state mismatch', async () => {
      await client.authorize()

      const callbackUrl = 'http://localhost:3000/callback?code=test-code&state=wrong-state'

      await expect(client.handleCallback(callbackUrl)).rejects.toThrow('State mismatch')
    })

    it('should throw error when authorization fails', async () => {
      const callbackUrl = 'http://localhost:3000/callback?error=access_denied&error_description=User+denied+access'

      await expect(client.handleCallback(callbackUrl)).rejects.toThrow(
        'Authorization failed: access_denied'
      )
    })

    it('should store tokens in localStorage', async () => {
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

      await client.authorize()
      const state = sessionStorage.getItem('fhir_sdk_auth_state')!

      const callbackUrl = `http://localhost:3000/callback?code=test-code&state=${state}`
      await client.handleCallback(callbackUrl)

      expect(localStorage.getItem('fhir_sdk_access_token')).toBe('test-access-token')
      expect(localStorage.getItem('fhir_sdk_refresh_token')).toBe('test-refresh-token')
      expect(localStorage.getItem('fhir_sdk_patient_id')).toBe('patient-123')
    })

    it('should clear auth state after successful callback', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })

      await client.authorize()
      const state = sessionStorage.getItem('fhir_sdk_auth_state')!

      const callbackUrl = `http://localhost:3000/callback?code=test-code&state=${state}`
      await client.handleCallback(callbackUrl)

      expect(sessionStorage.getItem('fhir_sdk_auth_state')).toBeNull()
      expect(sessionStorage.getItem('fhir_sdk_auth_code_verifier')).toBeNull()
    })
  })

  describe('refreshAccessToken', () => {
    let client: SMARTAuthClient

    beforeEach(() => {
      client = new SMARTAuthClient('epic-test')
    })

    it('should refresh token successfully', async () => {
      const mockRefreshResponse: TokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }

      // Set up initial refresh token
      localStorage.setItem('fhir_sdk_refresh_token', 'old-refresh-token')

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      })

      const response = await client.refreshAccessToken()

      expect(response).toEqual(mockRefreshResponse)
      expect(localStorage.getItem('fhir_sdk_access_token')).toBe('new-access-token')
    })

    it('should throw error when no refresh token available', async () => {
      await expect(client.refreshAccessToken()).rejects.toThrow(
        'No refresh token available'
      )
    })

    it('should throw error when refresh fails', async () => {
      localStorage.setItem('fhir_sdk_refresh_token', 'invalid-token')

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid refresh token',
      })

      await expect(client.refreshAccessToken()).rejects.toThrow('Token refresh failed')
    })

    it('should call onTokenRefresh callback', async () => {
      const onTokenRefresh = jest.fn()
      const clientWithCallback = new SMARTAuthClient('epic-test', { onTokenRefresh })

      const mockRefreshResponse: TokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
      }

      localStorage.setItem('fhir_sdk_refresh_token', 'old-refresh-token')

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      })

      await clientWithCallback.refreshAccessToken()

      expect(onTokenRefresh).toHaveBeenCalledWith('new-access-token')
    })
  })

  describe('getAccessToken', () => {
    let client: SMARTAuthClient

    beforeEach(() => {
      client = new SMARTAuthClient('epic-test')
    })

    it('should return valid access token', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))

      const token = await client.getAccessToken()

      expect(token).toBe('test-token')
    })

    it('should throw error when no token available', async () => {
      await expect(client.getAccessToken()).rejects.toThrow('No access token available')
    })

    it('should refresh expired token automatically', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'old-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() - 1000))
      localStorage.setItem('fhir_sdk_refresh_token', 'refresh-token')

      const mockRefreshResponse: TokenResponse = {
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      })

      const token = await client.getAccessToken()

      expect(token).toBe('new-token')
    })
  })

  describe('isAuthenticated', () => {
    let client: SMARTAuthClient

    beforeEach(() => {
      client = new SMARTAuthClient('epic-test')
    })

    it('should return true when token is valid', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() + 3600000))

      const isAuth = await client.isAuthenticated()

      expect(isAuth).toBe(true)
    })

    it('should return false when no token', async () => {
      const isAuth = await client.isAuthenticated()

      expect(isAuth).toBe(false)
    })

    it('should return false when token is expired', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_token_expiry', String(Date.now() - 1000))

      const isAuth = await client.isAuthenticated()

      expect(isAuth).toBe(false)
    })
  })

  describe('logout', () => {
    let client: SMARTAuthClient

    beforeEach(() => {
      client = new SMARTAuthClient('epic-test')
    })

    it('should clear all tokens and state', async () => {
      localStorage.setItem('fhir_sdk_access_token', 'test-token')
      localStorage.setItem('fhir_sdk_refresh_token', 'refresh-token')
      localStorage.setItem('fhir_sdk_patient_id', 'patient-123')
      sessionStorage.setItem('fhir_sdk_auth_state', 'test-state')

      await client.logout()

      expect(localStorage.getItem('fhir_sdk_access_token')).toBeNull()
      expect(localStorage.getItem('fhir_sdk_refresh_token')).toBeNull()
      expect(localStorage.getItem('fhir_sdk_patient_id')).toBeNull()
      expect(sessionStorage.getItem('fhir_sdk_auth_state')).toBeNull()
    })
  })

  describe('getPatientId', () => {
    let client: SMARTAuthClient

    beforeEach(() => {
      client = new SMARTAuthClient('epic-test')
    })

    it('should return stored patient ID', async () => {
      localStorage.setItem('fhir_sdk_patient_id', 'patient-123')

      const patientId = await client.getPatientId()

      expect(patientId).toBe('patient-123')
    })

    it('should return null when no patient ID', async () => {
      const patientId = await client.getPatientId()

      expect(patientId).toBeNull()
    })
  })
})
