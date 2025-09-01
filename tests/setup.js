/**
 * Jest setup file for global test configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.CACHE_TTL_MINUTES = '1';
process.env.MAX_RETRY_ATTEMPTS = '2';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(15000);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Stop cache cleanup interval
  const cacheService = require('../src/services/cache');
  if (cacheService.stopCleanup) {
    cacheService.stopCleanup();
  }
});
