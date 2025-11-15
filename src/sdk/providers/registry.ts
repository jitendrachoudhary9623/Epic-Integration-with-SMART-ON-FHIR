/**
 * EMR Provider Registry
 * Manages all registered EMR providers and their configurations
 */

import type { EMRProviderConfig } from '../types';

export class EMRRegistry {
  private static instance: EMRRegistry;
  private providers: Map<string, EMRProviderConfig> = new Map();

  private constructor() {}

  static getInstance(): EMRRegistry {
    if (!EMRRegistry.instance) {
      EMRRegistry.instance = new EMRRegistry();
    }
    return EMRRegistry.instance;
  }

  /**
   * Register a new EMR provider
   */
  registerProvider(config: EMRProviderConfig): void {
    if (this.providers.has(config.id)) {
      console.warn(`Provider with id "${config.id}" already exists. Overwriting...`);
    }
    this.providers.set(config.id, config);
  }

  /**
   * Register multiple providers at once
   */
  registerProviders(configs: EMRProviderConfig[]): void {
    configs.forEach(config => this.registerProvider(config));
  }

  /**
   * Get a provider by ID
   */
  getProvider(id: string): EMRProviderConfig {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider with id "${id}" not found`);
    }
    return provider;
  }

  /**
   * Check if a provider exists
   */
  hasProvider(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * List all registered providers
   */
  listProviders(): EMRProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Remove a provider
   */
  removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
  }

  /**
   * Replace URL parameters in provider URLs (e.g., {TENANT_ID})
   */
  resolveProviderUrls(provider: EMRProviderConfig, params: Record<string, string>): EMRProviderConfig {
    if (!provider.quirks?.urlParams) {
      return provider;
    }

    let authUrl = provider.authUrl;
    let tokenUrl = provider.tokenUrl;
    let fhirBaseUrl = provider.fhirBaseUrl;

    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      authUrl = authUrl.replace(placeholder, value);
      tokenUrl = tokenUrl.replace(placeholder, value);
      fhirBaseUrl = fhirBaseUrl.replace(placeholder, value);
    });

    return {
      ...provider,
      authUrl,
      tokenUrl,
      fhirBaseUrl,
    };
  }
}

export const emrRegistry = EMRRegistry.getInstance();
