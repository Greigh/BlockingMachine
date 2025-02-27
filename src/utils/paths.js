// Define __dirname for ES modules
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Get the project root directory (two levels up from utils folder)
const rootDir = resolve(__dirname, '../../');

// Define the filters directory
const filtersDir = resolve(rootDir, 'public/filters');

// Define the file paths relative to filters directory
export const thirdPartyFiltersFilePath = resolve(filtersDir, 'thirdPartyFilters.txt');
export const adguardDnsrewriteFilePath = resolve(filtersDir, 'adguard_dnsrewrite.txt');
export const browserRulesFilePath = resolve(filtersDir, 'browserRules.txt');
export const adguardFilePath = resolve(filtersDir, 'adguard.txt');
export const hostsFilePath = resolve(filtersDir, 'hosts.txt');
export const readmePath = resolve(rootDir, 'README.md');
export const statsFilePath = resolve(filtersDir, 'stats.json');