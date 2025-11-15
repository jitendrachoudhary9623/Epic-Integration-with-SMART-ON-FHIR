/**
 * Unit tests for PKCE utilities
 */

import { generatePKCEChallenge, generateState, parseJWT } from '../../utils/pkce'

describe('PKCE Utilities', () => {
  describe('generatePKCEChallenge', () => {
    it('should generate a valid PKCE challenge', async () => {
      const challenge = await generatePKCEChallenge()

      expect(challenge).toHaveProperty('code_verifier')
      expect(challenge).toHaveProperty('code_challenge')
      expect(typeof challenge.code_verifier).toBe('string')
      expect(typeof challenge.code_challenge).toBe('string')
      expect(challenge.code_verifier.length).toBeGreaterThan(40)
      expect(challenge.code_challenge.length).toBeGreaterThan(40)
    })

    it('should generate unique challenges each time', async () => {
      const challenge1 = await generatePKCEChallenge()
      const challenge2 = await generatePKCEChallenge()

      expect(challenge1.code_verifier).not.toBe(challenge2.code_verifier)
      expect(challenge1.code_challenge).not.toBe(challenge2.code_challenge)
    })
  })

  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state = generateState()

      expect(typeof state).toBe('string')
      expect(state.length).toBe(64) // 32 bytes * 2 hex chars
    })

    it('should generate unique states each time', () => {
      const state1 = generateState()
      const state2 = generateState()

      expect(state1).not.toBe(state2)
    })

    it('should only contain hex characters', () => {
      const state = generateState()

      expect(state).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('parseJWT', () => {
    it('should parse a valid JWT token', () => {
      // Create a simple JWT: header.payload.signature
      const payload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 }
      const base64Payload = btoa(JSON.stringify(payload))
      const token = `header.${base64Payload}.signature`

      const parsed = parseJWT(token)

      expect(parsed).toEqual(payload)
    })

    it('should parse JWT with patient ID', () => {
      const payload = { patient: 'patient-123', sub: '1234567890' }
      const base64Payload = btoa(JSON.stringify(payload))
      const token = `header.${base64Payload}.signature`

      const parsed = parseJWT(token)

      expect(parsed.patient).toBe('patient-123')
    })

    it('should parse JWT with fhirUser claim', () => {
      const payload = { fhirUser: 'Patient/patient-456', sub: '1234567890' }
      const base64Payload = btoa(JSON.stringify(payload))
      const token = `header.${base64Payload}.signature`

      const parsed = parseJWT(token)

      expect(parsed.fhirUser).toBe('Patient/patient-456')
    })

    it('should handle URL-safe base64 encoding', () => {
      const payload = { test: 'data-with-special+chars/=' }
      const base64Payload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
      const token = `header.${base64Payload}.signature`

      const parsed = parseJWT(token)

      expect(parsed).toEqual(payload)
    })

    it('should return null for invalid JWT', () => {
      const invalidToken = 'not.a.valid.jwt'

      const parsed = parseJWT(invalidToken)

      expect(parsed).toBeNull()
    })

    it('should return null for malformed JWT', () => {
      const malformedToken = 'header.invalid-base64!@#$.signature'

      const parsed = parseJWT(malformedToken)

      expect(parsed).toBeNull()
    })

    it('should handle JWT with special characters in payload', () => {
      const payload = { email: 'test@example.com', name: 'Test User' }
      const base64Payload = btoa(JSON.stringify(payload))
      const token = `header.${base64Payload}.signature`

      const parsed = parseJWT(token)

      expect(parsed.email).toBe('test@example.com')
      expect(parsed.name).toBe('Test User')
    })
  })
})
