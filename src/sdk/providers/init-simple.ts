/**
 * Simple SDK Initialization
 *
 * Frontend just specifies which EMRs to enable with their credentials.
 * SDK handles all the configuration internally.
 */

import { emrRegistry } from './registry';
import { createProviderConfig, PROVIDER_TEMPLATES } from './templates';

export interface SimpleProviderConfig {
  emrId: 'epic' | 'cerner' | 'athena' | 'allscripts' | 'nextgen' | 'meditech' | 'eclinicalworks';
  clientId: string;
  redirectUri: string;
  tenantId?: string; // For Cerner
}

/**
 * Simple initialization - just pass EMR ID, client ID, and redirect URI
 * SDK handles everything else internally
 *
 * @example
 * ```typescript
 * initSimpleSDK([
 *   { emrId: 'epic', clientId: 'abc123', redirectUri: 'http://localhost:3000' },
 *   { emrId: 'cerner', clientId: 'xyz789', redirectUri: 'http://localhost:3000', tenantId: 'tenant-123' }
 * ]);
 * ```
 */
export function initSimpleSDK(configs: SimpleProviderConfig[]): void {
  emrRegistry.clear();

  configs.forEach(config => {
    const template = PROVIDER_TEMPLATES[config.emrId];

    if (!template) {
      console.error(`Unknown EMR: ${config.emrId}`);
      return;
    }

    const urlParams: Record<string, string> = {};

    // Handle Cerner tenant ID
    if (config.emrId === 'cerner' && config.tenantId) {
      urlParams.TENANT_ID = config.tenantId;
    }

    const providerConfig = createProviderConfig(template, {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      urlParams: Object.keys(urlParams).length > 0 ? urlParams : undefined,
    });

    emrRegistry.registerProvider(providerConfig);
  });

  console.log(`✅ SDK initialized with ${configs.length} EMR(s):`,
    configs.map(c => c.emrId).join(', ')
  );
}

/**
 * Initialize from environment variables (for development)
 * Reads standard Next.js env variables
 */
export function initFromEnv(): void {
  const configs: SimpleProviderConfig[] = [];

  // Epic
  const epicClientId = process.env.NEXT_PUBLIC_CLIENT_ID || process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
  if (epicClientId) {
    configs.push({
      emrId: 'epic',
      clientId: epicClientId,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000',
    });
  }

  // Cerner
  if (process.env.NEXT_PUBLIC_CERNER_CLIENT_ID) {
    configs.push({
      emrId: 'cerner',
      clientId: process.env.NEXT_PUBLIC_CERNER_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000',
      tenantId: process.env.NEXT_PUBLIC_CERNER_TENANT_ID,
    });
  }

  // Athena
  if (process.env.NEXT_PUBLIC_ATHENA_CLIENT_ID) {
    configs.push({
      emrId: 'athena',
      clientId: process.env.NEXT_PUBLIC_ATHENA_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000',
    });
  }

  // Allscripts
  if (process.env.NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID) {
    configs.push({
      emrId: 'allscripts',
      clientId: process.env.NEXT_PUBLIC_ALLSCRIPTS_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000',
    });
  }

  // NextGen
  if (process.env.NEXT_PUBLIC_NEXTGEN_CLIENT_ID) {
    configs.push({
      emrId: 'nextgen',
      clientId: process.env.NEXT_PUBLIC_NEXTGEN_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000',
    });
  }

  if (configs.length === 0) {
    console.warn('⚠️  No EMR credentials found in environment variables');
    console.warn('Set at least: NEXT_PUBLIC_CLIENT_ID and NEXT_PUBLIC_REDIRECT_URI');
    return;
  }

  initSimpleSDK(configs);
}
