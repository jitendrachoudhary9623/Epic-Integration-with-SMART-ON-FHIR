/**
 * Test setup file for SDK tests
 */

import '@testing-library/jest-dom'

// Mock pkce-challenge module
jest.mock('pkce-challenge', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    code_verifier: 'mock-code-verifier-123456789012345678901234567890',
    code_challenge: 'mock-code-challenge-abcdefghijklmnopqrstuvwxyz',
  }),
}))

// Mock crypto.getRandomValues for Node environment
if (typeof global.crypto === 'undefined') {
  const cryptoModule = require('crypto')
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: (arr: any) => cryptoModule.randomBytes(arr.length),
      subtle: cryptoModule.webcrypto?.subtle,
    },
  })
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

// Mock atob and btoa
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')

// Clear all mocks before each test
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  jest.clearAllMocks()
})

// Suppress console logs in tests unless debugging
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})
