/**
 * FHIR Client
 * Handles all FHIR API interactions with provider-specific quirks
 */

import type {
  FHIRResource,
  Bundle,
  EMRProviderConfig,
  RequestOptions,
  SearchParams,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types';
import { FHIRError } from '../types';
import { SMARTAuthClient } from './auth-client';
import { emrRegistry } from '../providers';

export interface FHIRClientConfig {
  providerId: string;
  authClient?: SMARTAuthClient;
  autoRefreshToken?: boolean;
  onError?: (error: FHIRError) => void;
}

export class FHIRClient {
  private provider: EMRProviderConfig;
  private authClient?: SMARTAuthClient;
  private autoRefreshToken: boolean;
  private onError?: (error: FHIRError) => void;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: FHIRClientConfig) {
    this.provider = emrRegistry.getProvider(config.providerId);
    this.authClient = config.authClient;
    this.autoRefreshToken = config.autoRefreshToken ?? true;
    this.onError = config.onError;
  }

  /**
   * Set authentication client
   */
  setAuthClient(authClient: SMARTAuthClient): void {
    this.authClient = authClient;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Get a single FHIR resource by ID
   */
  async read<T extends FHIRResource>(
    resourceType: string,
    id: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.provider.fhirBaseUrl}/${resourceType}/${id}`;
    return this.request<T>(url, options);
  }

  /**
   * Search for FHIR resources
   */
  async search<T extends FHIRResource>(
    resourceType: string,
    params: SearchParams = {},
    options: RequestOptions = {}
  ): Promise<T[]> {
    const queryParams = new URLSearchParams();

    // Add search parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    // Apply provider-specific quirks for search parameters
    this.applySearchQuirks(resourceType, queryParams);

    const url = `${this.provider.fhirBaseUrl}/${resourceType}?${queryParams.toString()}`;
    const bundle = await this.request<Bundle<T>>(url, options);

    return this.extractResources<T>(bundle, resourceType);
  }

  /**
   * Get all resources for a patient
   */
  async searchByPatient<T extends FHIRResource>(
    resourceType: string,
    patientId: string,
    additionalParams: SearchParams = {},
    options: RequestOptions = {}
  ): Promise<T[]> {
    return this.search<T>(
      resourceType,
      {
        patient: patientId,
        ...additionalParams,
      },
      options
    );
  }

  /**
   * Make a raw FHIR request
   */
  private async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    // Get access token
    if (!this.authClient) {
      throw new Error('Auth client not configured');
    }

    let accessToken: string;
    try {
      accessToken = await this.authClient.getAccessToken();
    } catch (error) {
      throw new FHIRError(
        'Failed to get access token',
        401,
        undefined,
        undefined,
        this.provider.id
      );
    }

    // Build headers
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': this.provider.quirks?.acceptHeader || 'application/fhir+json',
      ...this.provider.quirks?.customHeaders,
      ...options.headers,
    };

    // Build request options
    let requestOptions: RequestOptions = {
      ...options,
      headers,
    };

    // Apply request interceptors
    let finalUrl = url;
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(finalUrl, requestOptions);
      finalUrl = result.url;
      requestOptions = result.options;
    }

    // Make request
    let response: Response;
    try {
      response = await fetch(finalUrl, {
        method: 'GET',
        headers: requestOptions.headers as HeadersInit,
      });
    } catch (error) {
      throw new FHIRError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        undefined,
        undefined,
        this.provider.id
      );
    }

    // Handle errors
    if (!response.ok) {
      await this.handleError(response);
    }

    // Parse response
    let data: any;
    try {
      data = await response.json();
    } catch (error) {
      throw new FHIRError(
        'Failed to parse response JSON',
        response.status,
        undefined,
        undefined,
        this.provider.id
      );
    }

    // Apply response interceptors
    for (const interceptor of this.responseInterceptors) {
      data = await interceptor(response, data);
    }

    return data;
  }

  /**
   * Handle HTTP errors with provider-specific logic
   */
  private async handleError(response: Response): Promise<never> {
    const notFoundCodes = this.provider.quirks?.notFoundStatusCodes || [];

    // Some providers return 403 instead of 404 for restricted resources
    if (notFoundCodes.includes(response.status)) {
      const error = new FHIRError(
        'Resource not found or access denied',
        response.status,
        undefined,
        undefined,
        this.provider.id
      );
      if (this.onError) {
        this.onError(error);
      }
      // Return empty array instead of throwing
      return [] as never;
    }

    let errorMessage = `FHIR request failed: ${response.status} ${response.statusText}`;
    let operationOutcome: any;

    try {
      const errorData = await response.json();
      if (errorData.resourceType === 'OperationOutcome') {
        operationOutcome = errorData;
        const issue = errorData.issue?.[0];
        if (issue) {
          errorMessage = issue.diagnostics || issue.details?.text || errorMessage;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }

    const error = new FHIRError(
      errorMessage,
      response.status,
      undefined,
      operationOutcome,
      this.provider.id
    );

    if (this.onError) {
      this.onError(error);
    }

    throw error;
  }

  /**
   * Extract resources from Bundle
   */
  private extractResources<T extends FHIRResource>(
    bundle: Bundle<T>,
    resourceType?: string
  ): T[] {
    if (!bundle.entry || bundle.entry.length === 0) {
      return [];
    }

    let resources = bundle.entry.map(entry => entry.resource);

    // Filter by resource type if provider quirk requires it
    if (resourceType && this.provider.quirks?.filterByResourceType) {
      resources = resources.filter(r => r.resourceType === resourceType);
    }

    return resources;
  }

  /**
   * Apply provider-specific search quirks
   */
  private applySearchQuirks(resourceType: string, params: URLSearchParams): void {
    // Add status filters based on resource type (Epic requirement)
    if (this.provider.id === 'epic') {
      if (resourceType === 'MedicationRequest' && !params.has('status')) {
        params.append('status', 'active');
      }
      if (resourceType === 'Appointment' && !params.has('status')) {
        params.append('status', 'booked');
      }
    }

    // Handle date filter requirements
    const requiresDate = this.provider.quirks?.requiresDateFilter?.[resourceType];
    if (requiresDate && !params.has('date')) {
      // Add default date range (last 2 years)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      params.append('date', `ge${startDate.toISOString().split('T')[0]}`);
    }

    // Add sorting
    if (!params.has('_sort') && resourceType === 'Observation') {
      params.append('_sort', '-date');
    }
  }

  /**
   * Get provider configuration
   */
  getProvider(): EMRProviderConfig {
    return this.provider;
  }

  /**
   * Check if a resource type is supported
   */
  isResourceSupported(resourceType: string): boolean {
    const supported = this.provider.capabilities?.supportedResources;
    if (!supported) return true; // Assume supported if not specified
    return supported.includes(resourceType);
  }
}
