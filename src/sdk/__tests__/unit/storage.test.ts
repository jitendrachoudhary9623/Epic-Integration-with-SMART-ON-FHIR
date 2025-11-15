/**
 * Unit tests for storage utilities
 */

import { LocalStorageTokenStorage, SessionStorageAuthState } from '../../utils/storage'

describe('LocalStorageTokenStorage', () => {
  let storage: LocalStorageTokenStorage

  beforeEach(() => {
    storage = new LocalStorageTokenStorage()
    localStorage.clear()
  })

  describe('access token', () => {
    it('should store and retrieve access token', async () => {
      const token = 'test-access-token'

      await storage.setAccessToken(token)
      const retrieved = await storage.getAccessToken()

      expect(retrieved).toBe(token)
    })

    it('should return null for non-existent access token', async () => {
      const token = await storage.getAccessToken()

      expect(token).toBeNull()
    })
  })

  describe('refresh token', () => {
    it('should store and retrieve refresh token', async () => {
      const token = 'test-refresh-token'

      await storage.setRefreshToken(token)
      const retrieved = await storage.getRefreshToken()

      expect(retrieved).toBe(token)
    })

    it('should return null for non-existent refresh token', async () => {
      const token = await storage.getRefreshToken()

      expect(token).toBeNull()
    })
  })

  describe('id token', () => {
    it('should store and retrieve id token', async () => {
      const token = 'test-id-token'

      await storage.setIdToken(token)
      const retrieved = await storage.getIdToken()

      expect(retrieved).toBe(token)
    })

    it('should return null for non-existent id token', async () => {
      const token = await storage.getIdToken()

      expect(token).toBeNull()
    })
  })

  describe('token expiry', () => {
    it('should store and retrieve token expiry', async () => {
      const expiry = Date.now() + 3600000

      await storage.setTokenExpiry(expiry)
      const retrieved = await storage.getTokenExpiry()

      expect(retrieved).toBe(expiry)
    })

    it('should return null for non-existent expiry', async () => {
      const expiry = await storage.getTokenExpiry()

      expect(expiry).toBeNull()
    })

    it('should handle expiry as number', async () => {
      const expiry = 1234567890

      await storage.setTokenExpiry(expiry)
      const retrieved = await storage.getTokenExpiry()

      expect(typeof retrieved).toBe('number')
      expect(retrieved).toBe(expiry)
    })
  })

  describe('patient ID', () => {
    it('should store and retrieve patient ID', async () => {
      const patientId = 'patient-123'

      await storage.setPatientId(patientId)
      const retrieved = await storage.getPatientId()

      expect(retrieved).toBe(patientId)
    })

    it('should return null for non-existent patient ID', async () => {
      const patientId = await storage.getPatientId()

      expect(patientId).toBeNull()
    })
  })

  describe('clear', () => {
    it('should clear all stored tokens', async () => {
      await storage.setAccessToken('access-token')
      await storage.setRefreshToken('refresh-token')
      await storage.setIdToken('id-token')
      await storage.setPatientId('patient-123')
      await storage.setTokenExpiry(Date.now())

      await storage.clear()

      expect(await storage.getAccessToken()).toBeNull()
      expect(await storage.getRefreshToken()).toBeNull()
      expect(await storage.getIdToken()).toBeNull()
      expect(await storage.getPatientId()).toBeNull()
      expect(await storage.getTokenExpiry()).toBeNull()
    })

    it('should only clear keys with the correct prefix', async () => {
      await storage.setAccessToken('test-token')
      localStorage.setItem('other_key', 'other-value')

      await storage.clear()

      expect(await storage.getAccessToken()).toBeNull()
      expect(localStorage.getItem('other_key')).toBe('other-value')
    })
  })

  describe('custom prefix', () => {
    it('should use custom prefix for storage keys', async () => {
      const customStorage = new LocalStorageTokenStorage('custom_prefix_')
      await customStorage.setAccessToken('test-token')

      const key = Object.keys(localStorage).find(k => k.startsWith('custom_prefix_'))
      expect(key).toBeDefined()
      expect(key).toBe('custom_prefix_access_token')
    })

    it('should isolate storage with different prefixes', async () => {
      const storage1 = new LocalStorageTokenStorage('app1_')
      const storage2 = new LocalStorageTokenStorage('app2_')

      await storage1.setAccessToken('token1')
      await storage2.setAccessToken('token2')

      expect(await storage1.getAccessToken()).toBe('token1')
      expect(await storage2.getAccessToken()).toBe('token2')

      await storage1.clear()

      expect(await storage1.getAccessToken()).toBeNull()
      expect(await storage2.getAccessToken()).toBe('token2')
    })
  })
})

describe('SessionStorageAuthState', () => {
  let authState: SessionStorageAuthState

  beforeEach(() => {
    authState = new SessionStorageAuthState()
    sessionStorage.clear()
  })

  describe('state', () => {
    it('should store and retrieve state', () => {
      const state = 'test-state-123'

      authState.setState(state)
      const retrieved = authState.getState()

      expect(retrieved).toBe(state)
    })

    it('should return null for non-existent state', () => {
      const state = authState.getState()

      expect(state).toBeNull()
    })

    it('should clear state', () => {
      authState.setState('test-state')

      authState.clearState()

      expect(authState.getState()).toBeNull()
    })
  })

  describe('code verifier', () => {
    it('should store and retrieve code verifier', () => {
      const verifier = 'test-code-verifier'

      authState.setCodeVerifier(verifier)
      const retrieved = authState.getCodeVerifier()

      expect(retrieved).toBe(verifier)
    })

    it('should return null for non-existent code verifier', () => {
      const verifier = authState.getCodeVerifier()

      expect(verifier).toBeNull()
    })

    it('should clear code verifier', () => {
      authState.setCodeVerifier('test-verifier')

      authState.clearCodeVerifier()

      expect(authState.getCodeVerifier()).toBeNull()
    })
  })

  describe('provider ID', () => {
    it('should store and retrieve provider ID', () => {
      const providerId = 'epic'

      authState.setProviderId(providerId)
      const retrieved = authState.getProviderId()

      expect(retrieved).toBe(providerId)
    })

    it('should return null for non-existent provider ID', () => {
      const providerId = authState.getProviderId()

      expect(providerId).toBeNull()
    })

    it('should clear provider ID', () => {
      authState.setProviderId('epic')

      authState.clearProviderId()

      expect(authState.getProviderId()).toBeNull()
    })
  })

  describe('clear', () => {
    it('should clear all auth state', () => {
      authState.setState('test-state')
      authState.setCodeVerifier('test-verifier')
      authState.setProviderId('epic')

      authState.clear()

      expect(authState.getState()).toBeNull()
      expect(authState.getCodeVerifier()).toBeNull()
      expect(authState.getProviderId()).toBeNull()
    })
  })

  describe('custom prefix', () => {
    it('should use custom prefix for storage keys', () => {
      const customAuthState = new SessionStorageAuthState('custom_auth_')
      customAuthState.setState('test-state')

      const key = Object.keys(sessionStorage).find(k => k.startsWith('custom_auth_'))
      expect(key).toBeDefined()
      expect(key).toBe('custom_auth_state')
    })

    it('should isolate storage with different prefixes', () => {
      const authState1 = new SessionStorageAuthState('auth1_')
      const authState2 = new SessionStorageAuthState('auth2_')

      authState1.setState('state1')
      authState2.setState('state2')

      expect(authState1.getState()).toBe('state1')
      expect(authState2.getState()).toBe('state2')

      authState1.clear()

      expect(authState1.getState()).toBeNull()
      expect(authState2.getState()).toBe('state2')
    })
  })
})
