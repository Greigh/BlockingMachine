// Define __dirname for ES modules
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Import the 'path' module to handle and transform file paths
import path from 'path';

// Get the project root directory (two levels up from utils folder)
const rootDir = path.resolve(__dirname, '../../');

// Define the file paths relative to project root
export const thirdPartyFiltersFilePath = path.join(rootDir, 'thirdPartyFilters.txt');
export const adguardDnsrewriteFilePath = path.join(rootDir, 'adguard_dnsrewrite.txt'); // Changed from mergedFilePath
export const browserRulesFilePath = path.join(rootDir, 'browserRules.txt');
export const outputFilePath = path.join(rootDir, 'output.txt');
export const adguardFilePath = path.join(rootDir, 'adguard.txt');
export const hostsFilePath = path.join(rootDir, 'hosts.txt');
export const readmePath = path.join(rootDir, 'README.md');
export const filtersFilePath = path.join(rootDir, 'filters.txt');