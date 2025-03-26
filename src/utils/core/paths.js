/**
 * Path Configuration Module
 * @module paths
 */

import { promises as fs } from 'fs';
import { logMessage, LogLevel } from './logger.js';
import { join } from 'path';

// Base directories
const baseDir = process.cwd();
const filtersDir = join(baseDir, 'filters');

// Define paths object - single source of truth
export const paths = {
  input: {
    dir: join(filtersDir, 'input'),
    personalList: join(filtersDir, 'input', 'personal_list.txt'),
    thirdPartyFilters: join(filtersDir, 'input', 'thirdPartyFilters.txt'),
  },
  output: {
    dir: join(filtersDir, 'output'),
    adguard: join(filtersDir, 'output', 'adguard.txt'),
    dnsRewrite: join(filtersDir, 'output', 'adguard_dnsrewrite.txt'),
    browser: join(filtersDir, 'output', 'browserRules.txt'),
    hosts: join(filtersDir, 'output', 'hosts.txt'),
    stats: join(filtersDir, 'output', 'stats.json'), // Define stats file in output dir
  },
  logs: join(baseDir, 'logs'),
  test: {
    dir: join(baseDir, 'tests'),
    results: join(baseDir, 'tests', 'results'),
    coverage: join(baseDir, 'coverage'),
  },
};

// Export individual paths
export const inputDir = paths.input.dir;
export const outputDir = paths.output.dir;
export const logsDir = paths.logs;
export const personalListFilePath = paths.input.personalList;
export const thirdPartyFiltersFilePath = paths.input.thirdPartyFilters;
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
