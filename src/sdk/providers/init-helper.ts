/**
 * SDK Initialization Helper
 * Helps initialize SDK with dynamic configuration from frontend
 */

import { emrRegistry } from './registry';
import { createProviderConfig, PROVIDER_TEMPLATES } from './templates';
import type { EMRProviderConfig } from '../types';

/**
 * Configuration for initializing a provider
 */
export interface ProviderInitConfig {
  providerId: keyof typeof PROVIDER_TEMPLATES;
  clientId: string;
  redirectUri: string;
  urlParams?: Record<string, string>;
  customConfig?: Partial<Omit<EMRProviderConfig, 'id' | 'clientId' | 'redirectUri'>>;
}

/**
 * Initialize SDK with providers from frontend configuration
 *
 * @example
 * ```typescript
 * initializeSDK([
 *   {
 *     providerId: 'epic',
 *     clientId: 'your-epic-client-id',
 *     redirectUri: 'http://localhost:3000/callback'
 *   },
 *   {
 *     providerId: 'cerner',
 *     clientId: 'your-cerner-client-id',
 *     redirectUri: 'http://localhost:3000/callback',
 *     urlParams: { TENANT_ID: 'your-tenant-id' }
 *   }
 * ]);
 * ```
 */
export function initializeSDK(providers: ProviderInitConfig[]): void {
  emrRegistry.clear(); // Clear any existing providers

  providers.forEach(config => {
    const template = PROVIDER_TEMPLATES[config.providerId];

    if (!template) {
      console.warn(`Unknown provider template: ${config.providerId}`);
      return;
    }

    // Create provider config from template
    const providerConfig = createProviderConfig(template, {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      urlParams: config.urlParams,
    });

    // Apply custom overrides if provided
    if (config.customConfig) {
      Object.assign(providerConfig, config.customConfig);
    }

    // Register provider
    emrRegistry.registerProvider(providerConfig);
  });

  console.log(`FHIR SDK initialized with ${providers.length} provider(s):`, emrRegistry.getProviderIds());
}

/**
 * Initialize SDK with environment variables (backward compatible)
 * Use this only for development/testing
 */
export function initializeSDKFromEnv(): void {
  const providers: ProviderInitConfig[] = [];

  // Epic
  if (process.env.NEXT_PUBLIC_EPIC_CLIENT_ID) {
    providers.push({
      providerId: 'epic',
      clientId: process.env.NEXT_PUBLIC_EPIC_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
    });
  }

  // Cerner
  if (process.env.NEXT_PUBLIC_CERNER_CLIENT_ID) {
    providers.push({
      providerId: 'cerner',
      clientId: process.env.NEXT_PUBLIC_CERNER_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
      urlParams: {
        TENANT_ID: process.env.NEXT_PUBLIC_CERNER_TENANT_ID || 'ec2458f2-1e24-41c8-b71b-0e701af7583d',
      },
    });
  }

  // Athena
  if (process.env.NEXT_PUBLIC_ATHENA_CLIENT_ID) {
    providers.push({
      providerId: 'athena',
      clientId: process.env.NEXT_PUBLIC_ATHENA_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
    });
  }

  // Allscripts
  if (process.env.NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID) {
    providers.push({
      providerId: 'allscripts',
      clientId: process.env.NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
    });
  }

  // NextGen
  if (process.env.NEXT_PUBLIC_NEXTGEN_CLIENT_ID) {
    providers.push({
      providerId: 'nextgen',
      clientId: process.env.NEXT_PUBLIC_NEXTGEN_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
    });
  }

  // Meditech
  if (process.env.NEXT_PUBLIC_MEDITECH_CLIENT_ID) {
    providers.push({
      providerId: 'meditech',
      clientId: process.env.NEXT_PUBLIC_MEDITECH_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
    });
  }

  // eClinicalWorks
  if (process.env.NEXT_PUBLIC_ECLINICALWORKS_CLIENT_ID) {
    providers.push({
      providerId: 'eclinicalworks',
      clientId: process.env.NEXT_PUBLIC_ECLINICALWORKS_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
    });
  }

  if (providers.length === 0) {
    console.warn('No EMR providers configured in environment variables');
    return;
  }

  initializeSDK(providers);
}
