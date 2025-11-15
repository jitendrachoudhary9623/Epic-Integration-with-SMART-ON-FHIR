# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-15

### Added
- Initial release of @nirmiteeio/fhir-sdk
- Universal FHIR SDK for SMART on FHIR integrations
- Multi-EMR support:
  - Epic Systems (tested)
  - Cerner/Oracle Health (tested)
  - Athena Health (tested)
  - Allscripts (tested)
  - NextGen Healthcare (template)
  - Meditech (template)
  - eClinicalWorks (template)
- Core components:
  - `SMARTAuthClient` - OAuth 2.0 with PKCE authentication
  - `FHIRClient` - FHIR resource operations
  - `PatientService` - High-level patient data operations
- React hooks (optional):
  - `useFHIR` - All-in-one hook
  - `useAuth` - Authentication hook
  - `useFHIRClient` - FHIR client hook
  - `usePatientService` - Patient service hook
  - `usePatientData` - Patient data fetching hook
- Framework-agnostic core (works with React, Vue, Angular, Svelte, vanilla JS)
- Full TypeScript support with type definitions
- Dual format: CommonJS + ES Modules
- 71.9% test coverage with 128 tests
- Comprehensive documentation:
  - Main README
  - MODULARITY.md - Architecture guide
  - EXAMPLES.md - Usage examples
  - PUBLISHING.md - Publishing guide
  - MIGRATION.md - Migration guide

### Security
- OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- Automatic token refresh
- Secure token storage with configurable storage backends

### Documentation
- Complete API documentation
- Integration examples for multiple frameworks
- Step-by-step publishing guide
- Modularity and architecture documentation

[1.0.0]: https://github.com/Nirmitee-tech/fhir-sdk/releases/tag/v1.0.0
