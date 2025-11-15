# FHIR SDK Tests

Comprehensive test suite for the FHIR SDK with unit tests, integration tests, and mocks.

## Test Structure

```
__tests__/
├── unit/                 # Unit tests for individual modules
│   ├── pkce.test.ts             # PKCE utilities tests
│   ├── storage.test.ts          # Storage utilities tests
│   ├── auth-client.test.ts      # Auth client tests
│   ├── fhir-client.test.ts      # FHIR client tests
│   └── patient-service.test.ts  # Patient service tests
├── integration/          # Integration tests
│   └── oauth-flow.test.ts       # Complete OAuth flow tests
├── mocks/               # Test fixtures and mocks
│   ├── providers.ts             # Mock EMR providers
│   └── fhir-resources.ts        # Mock FHIR resources
├── setup.ts             # Test setup and global mocks
└── README.md            # This file
```

## Running Tests

### From SDK directory

```bash
cd src/sdk
npm test
```

### From project root

```bash
cd /Users/apple/IdeaProjects/Epic-Integration-with-SMART-ON-FHIR
npm test -- src/sdk
```

### Specific test suites

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Verbose output
npm run test:verbose
```

## Test Coverage

Target coverage: **60%+** (enforced in jest.config.js)

- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

Check coverage report:
```bash
npm run test:coverage
open __tests__/coverage/lcov-report/index.html
```

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions/classes in isolation:

```typescript
import { generatePKCEChallenge } from '../../utils/pkce'

describe('generatePKCEChallenge', () => {
  it('should generate valid PKCE challenge', async () => {
    const challenge = await generatePKCEChallenge()
    expect(challenge).toHaveProperty('code_verifier')
    expect(challenge).toHaveProperty('code_challenge')
  })
})
```

### Integration Tests

Integration tests should test multiple components working together:

```typescript
describe('OAuth Flow', () => {
  it('should complete full OAuth flow', async () => {
    const authClient = new SMARTAuthClient('epic-test')
    const authUrl = await authClient.authorize()
    // ... test complete flow
  })
})
```

### Using Mocks

Import pre-configured mocks:

```typescript
import { mockEpicProvider } from '../mocks/providers'
import { mockPatient, mockMedicationBundle } from '../mocks/fhir-resources'

// Use in tests
emrRegistry.registerProvider(mockEpicProvider)
;(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => mockPatient,
})
```

## Test Utilities

### Global Mocks

The `setup.ts` file provides:
- `localStorage` mock
- `sessionStorage` mock
- `fetch` mock
- `crypto.getRandomValues` mock
- `atob` / `btoa` mocks

### Mock Providers

- `mockEpicProvider` - Epic with PKCE enabled
- `mockCernerProvider` - Cerner without PKCE

### Mock FHIR Resources

- `mockPatient` - Patient resource
- `mockMedication` - MedicationRequest resource
- `mockObservation` - Observation resource
- `mockPatientBundle` - Bundle with Patient
- `mockMedicationBundle` - Bundle with MedicationRequest
- `mockObservationBundle` - Bundle with Observation
- `mockEmptyBundle` - Empty bundle

## CI/CD Integration

For continuous integration:

```bash
npm run test:ci
```

This runs tests with:
- Coverage collection
- Limited workers for CI environment
- Non-interactive mode

## Debugging Tests

### VSCode Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "${fileBasename}",
    "--config=${workspaceFolder}/src/sdk/jest.config.js",
    "--runInBand"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Run single test file

```bash
npm test -- __tests__/unit/pkce.test.ts
```

### Run single test case

```bash
npm test -- -t "should generate valid PKCE challenge"
```

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Mock external dependencies** - Use mocks for fetch, storage, etc.
3. **Clear state** - Reset mocks and storage in `beforeEach`
4. **Descriptive names** - Use clear test descriptions
5. **Test edge cases** - Test error conditions, empty data, etc.
6. **Avoid implementation details** - Test behavior, not internals
7. **Keep tests fast** - Unit tests should run in milliseconds

## Common Patterns

### Testing async functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### Testing errors

```typescript
it('should throw error for invalid input', async () => {
  await expect(functionThatThrows()).rejects.toThrow('Expected error')
})
```

### Testing fetch calls

```typescript
it('should call API with correct params', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: 'test' }),
  })

  await functionThatFetches()

  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.example.com/endpoint',
    expect.objectContaining({
      method: 'POST',
      headers: expect.any(Object),
    })
  )
})
```

## Troubleshooting

### Tests failing with "window is not defined"

The SDK has SSR checks (`typeof window === 'undefined'`). Tests run in jsdom environment which has window defined.

### Fetch not mocked

Ensure `beforeEach(() => { (global.fetch as jest.Mock).mockReset() })` is called.

### Storage not persisting between tests

Storage is cleared in `beforeEach` in setup.ts. If you need persistence, manage it manually in your test.

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
