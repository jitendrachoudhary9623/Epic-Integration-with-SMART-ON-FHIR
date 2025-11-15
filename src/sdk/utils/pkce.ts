/**
 * PKCE (Proof Key for Code Exchange) Utilities
 */

import pkceChallenge from 'pkce-challenge';
import type { PKCEChallenge } from '../types';

/**
 * Generate PKCE challenge and verifier
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const challenge = await pkceChallenge();
  return {
    code_verifier: challenge.code_verifier,
    code_challenge: challenge.code_challenge,
  };
}

/**
 * Generate a random state parameter for OAuth
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse JWT token without verification (for extracting patient ID)
 */
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}
