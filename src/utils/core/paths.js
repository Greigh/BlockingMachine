/**
 * Path Configuration Module
 * @module paths
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { logMessage, LogLevel } from './logger.js';

// Get base directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');

// Define paths object - single source of truth
export const paths = {
  logs: path.join(rootDir, 'logs'),
  filters: {
    input: path.join(rootDir, 'filters', 'input'),
    output: path.join(rootDir, 'filters', 'output'),
  },
  input: {
    personal: path.join(rootDir, 'filters', 'input', 'personal_list.txt'),
    thirdParty: path.join(rootDir, 'filters', 'input', 'thirdPartyFilters.txt'),
  },
  output: {
    adguard: path.join(rootDir, 'filters', 'output', 'adguard.txt'),
    dnsRewrite: path.join(
      rootDir,
      'filters',
      'output',
      'adguard_dnsrewrite.txt'
    ),
    browser: path.join(rootDir, 'filters', 'output', 'browserRules.txt'),
    hosts: path.join(rootDir, 'filters', 'output', 'hosts.txt'),
    stats: path.join(rootDir, 'filters', 'output', 'stats.json'),
  },
  docs: {
    readme: path.join(rootDir, 'README.md'),
  },
  config: {
    aglint: path.join(rootDir, 'config', '.aglintrc.yaml'),
    // Add other config files here as needed
  },
  test: {
    results: path.join(rootDir, 'tests', 'results'),
    fixtures: path.join(rootDir, 'tests', 'fixtures'),
  },
  coverage: path.join(rootDir, 'coverage'),
};

// Export individual paths
export const inputDir = paths.filters.input;
export const outputDir = paths.filters.output;
export const logsDir = paths.logs;
export const personalListFilePath = paths.input.personal;
export const thirdPartyFiltersFilePath = paths.input.thirdParty;
export const adguardFilePath = paths.output.adguard;
export const dnsRewriteFilePath = paths.output.dnsRewrite;
export const browserRulesFilePath = paths.output.browser;
export const hostsFilePath = paths.output.hosts;

// Debug log all exports
console.log('Exported Paths:', {
  inputDir,
  outputDir,
  logsDir,
  personalListFilePath,
  thirdPartyFiltersFilePath,
  adguardFilePath,
  dnsRewriteFilePath,
  browserRulesFilePath,
  hostsFilePath,
});

/**
 * Initialize output directories
 */
async function initializeOutputDirectories() {
  try {
    console.log('Initializing directories with:', { outputDir, logsDir });

    if (!outputDir || !logsDir) {
      throw new Error(
        `Invalid paths - outputDir: ${outputDir}, logsDir: ${logsDir}`
      );
    }

    console.log('Debug paths:', {
      outputDir: outputDir,
      outputDirType: typeof outputDir,
      logsDir: logsDir,
      logsDirType: typeof logsDir,
      directories: paths.filters,
    });

    await Promise.all([
      fs.mkdir(outputDir, { recursive: true }),
      fs.mkdir(logsDir, { recursive: true }),
    ]);

    await logMessage('Directories created successfully', LogLevel.DEBUG);
  } catch (error) {
    await logMessage(
      `Directory initialization failed: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}

export async function initializeFileSystem() {
  await initializeOutputDirectories();
}

// Add test directories to initialization
export async function initializePaths() {
  try {
    await Promise.all([
      fs.mkdir(paths.test.results, { recursive: true }),
      fs.mkdir(paths.coverage, { recursive: true }),
    ]);
  } catch (error) {
    await logMessage(
      `Failed to create test directories: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}
