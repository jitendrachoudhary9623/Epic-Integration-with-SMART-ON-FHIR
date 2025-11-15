/**
 * Token Storage Implementation
 * Handles secure storage of tokens and auth state
 */

import type { TokenStorage } from '../types';

export class LocalStorageTokenStorage implements TokenStorage {
  private prefix: string;

  constructor(prefix: string = 'fhir_sdk_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.getKey('access_token'));
  }

  async setAccessToken(token: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getKey('access_token'), token);
  }

  async getRefreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.getKey('refresh_token'));
  }

  async setRefreshToken(token: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getKey('refresh_token'), token);
  }

  async getIdToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.getKey('id_token'));
  }

  async setIdToken(token: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getKey('id_token'), token);
  }

  async getTokenExpiry(): Promise<number | null> {
    if (typeof window === 'undefined') return null;
    const expiry = localStorage.getItem(this.getKey('token_expiry'));
    return expiry ? parseInt(expiry, 10) : null;
  }

  async setTokenExpiry(expiry: number): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getKey('token_expiry'), expiry.toString());
  }

  async getPatientId(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.getKey('patient_id'));
  }

  async setPatientId(patientId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getKey('patient_id'), patientId);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export class SessionStorageAuthState {
  private prefix: string;

  constructor(prefix: string = 'fhir_sdk_auth_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  setState(state: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.getKey('state'), state);
  }

  getState(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.getKey('state'));
  }

  clearState(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.getKey('state'));
  }

  setCodeVerifier(verifier: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.getKey('code_verifier'), verifier);
  }

  getCodeVerifier(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.getKey('code_verifier'));
  }

  clearCodeVerifier(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.getKey('code_verifier'));
  }

  setProviderId(providerId: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.getKey('provider_id'), providerId);
  }

  getProviderId(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.getKey('provider_id'));
  }

  clearProviderId(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.getKey('provider_id'));
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    this.clearState();
    this.clearCodeVerifier();
    this.clearProviderId();
  }
}
