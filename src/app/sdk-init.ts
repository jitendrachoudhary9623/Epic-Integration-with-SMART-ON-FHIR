/**
 * SDK Initialization
 *
 * Pass your EMR configs to SDK.
 * SDK has NO hardcoded configs - it just uses what you give it.
 */

import { emrRegistry } from '@/sdk';
import { getConfiguredEMRs } from './emr-configs';

// Get EMR configs from your app (from env vars or API)
const emrConfigs = getConfiguredEMRs();

// Pass to SDK - SDK just registers and uses them
emrRegistry.registerProviders(emrConfigs);

console.log(`✅ SDK initialized with ${emrConfigs.length} EMR(s):`,
  emrConfigs.map(c => c.name).join(', ')
);

export { emrRegistry };
