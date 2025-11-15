/**
 * FHIR SDK - Main Entry Point
 *
 * A comprehensive SDK for SMART on FHIR integrations with multiple EMR providers.
 * Simplifies authentication, data fetching, and resource management.
 */

// Core classes and functions
export { SMARTAuthClient, type AuthClientOptions } from './core/auth-client'
export { FHIRClient, type FHIRClientConfig } from './core/fhir-client'
export * from './core/index'

// Providers
export { emrRegistry } from './providers/registry'
export { DEFAULT_PROVIDERS } from './providers/configs'
export * from './providers/configs'
export * from './providers/templates'
export * from './providers/init-helper'
export * from './providers/init-simple'

// Services
export { PatientService, type VitalsOptions, type LabReportsOptions } from './services/patient-service'
export * from './services/index'

// Hooks (optional - React)
export { useFHIR, useAuth, useFHIRClient, usePatientService, usePatientData } from './hooks/useFHIRSDK'
export * from './hooks/index'

// Types
export * from './types'

// Utils
export * from './utils'
