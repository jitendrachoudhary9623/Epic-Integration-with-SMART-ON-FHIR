module.exports = {
  displayName: 'FHIR SDK Tests',
  testEnvironment: 'jsdom',
  rootDir: './',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Module resolution
  moduleNameMapper: {
    '^@/sdk/(.*)$': '<rootDir>/$1',
  },

  // Test patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  // Coverage
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/*.md',
  ],

  coverageDirectory: '<rootDir>/__tests__/coverage',

  coverageThreshold: {
    global: {
      branches: 47,
      functions: 68,
      lines: 59,
      statements: 56,
    },
  },

  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!(pkce-challenge)/)',
  ],

  // TypeScript support
  preset: 'ts-jest',

  // Transform files
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.next/',
  ],

}
