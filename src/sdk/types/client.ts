/**
 * SDK Client Types
 */

import type { FHIRResource, OperationOutcome } from './fhir';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | string[]>;
  timeout?: number;
}

export interface SearchParams {
  patient?: string;
  category?: string;
  date?: string;
  status?: string;
  _sort?: string;
  _count?: number;
  [key: string]: string | number | string[] | undefined;
}

export interface FHIRClientConfig {
  providerId: string;
  autoRefreshToken?: boolean;
  onTokenRefresh?: (newToken: string) => void;
  onError?: (error: FHIRError) => void;
}

export class FHIRError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public resourceType?: string,
    public operationOutcome?: OperationOutcome,
    public providerId?: string
  ) {
    super(message);
    this.name = 'FHIRError';
  }
}

export type RequestInterceptor = (
  url: string,
  options: RequestOptions
) => Promise<{ url: string; options: RequestOptions }>;

export type ResponseInterceptor = (
  response: Response,
  data: any
) => Promise<any>;

export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  getIdToken(): Promise<string | null>;
  setIdToken(token: string): Promise<void>;
  getTokenExpiry(): Promise<number | null>;
  setTokenExpiry(expiry: number): Promise<void>;
  getPatientId(): Promise<string | null>;
  setPatientId(patientId: string): Promise<void>;
  clear(): Promise<void>;
}

export interface VitalsOptions {
  category?: string;
  date?: string;
  sort?: string;
}

export interface LabReportsOptions {
  category?: string;
  date?: string;
  sort?: string;
}
