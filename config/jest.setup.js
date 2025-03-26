import { jest, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { paths } from '../src/utils/core/paths.js';

// Import Node.js globals
import process from 'process';
import { global, console } from '@jest/globals';

// Increase timeout for async operations
jest.setTimeout(10000);

// Add custom matchers
expect.extend({
  toBeValidPath(received) {
    const pass = typeof received === 'string' && received.length > 0;
    return {
      message: () => `expected ${received} to be a valid path`,
      pass,
    };
  },

  toBeValidRule(received) {
    const pass =
      typeof received === 'string' &&
      (received.startsWith('||') ||
        received.startsWith('0.0.0.0') ||
        received.includes('##'));
    return {
      message: () => `expected ${received} to be a valid filter rule`,
      pass,
    };
  },

  toBeValidSet(received) {
    const pass = received instanceof Set && received.size >= 0;
    return {
      message: () => `expected ${received} to be a valid Set`,
      pass,
    };
  },

  toHaveMetadata(received) {
    const hasTitle = received.includes('! Title:');
    const hasDate = received.includes('! Last modified:');
    const hasRules = received.includes('! Number of rules:');
    const pass = hasTitle && hasDate && hasRules;
    return {
      message: () => `expected content to have valid metadata headers`,
      pass,
    };
  },

  // New path-specific matchers with improved error messages
  async toBeAccessiblePath(received) {
    try {
      await fs.access(received);
      return {
        message: () =>
          `Expected path "${received}" to not be accessible, but it was`,
        pass: true,
      };
    } catch {
      return {
        message: () =>
          `Expected path "${received}" to be accessible, but it wasn't`,
        pass: false,
      };
    }
  },

  toBeInDirectory(received, directory) {
    const normalizedPath = path.normalize(received);
    const normalizedDir = path.normalize(directory);
    const pass = normalizedPath.startsWith(normalizedDir);
    return {
      message: () =>
        pass
          ? `Expected "${received}" to not be in "${directory}"`
          : `Expected "${received}" to be in "${directory}"`,
      pass,
    };
  },

  toBeValidOutputPath(received) {
    const validPaths = [
      paths.output.adguard,
      paths.output.browser,
      paths.output.hosts,
    ];
    const pass = validPaths.some((p) => received.startsWith(p));
    return {
      message: () =>
        pass
          ? `Expected "${received}" to not be a valid output path`
          : `Expected "${received}" to be a valid output path (one of: ${validPaths.join(
              ', '
            )})`,
      pass,
    };
  },
});

// Global test environment setup
beforeAll(async () => {
  // Create test directories if they don't exist
  await Promise.all([
    fs.mkdir(paths.test.results, { recursive: true }),
    fs.mkdir(paths.coverage, { recursive: true }),
  ]);

  // Mock console methods
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  jest.restoreAllMocks();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  // Use global console to ensure output
  global.console.error('Unhandled Promise Rejection:', error);
  process.exit(1);
});

// Set test environment variables
process.env.NODE_ENV = 'test';
