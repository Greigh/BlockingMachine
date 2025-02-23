// Define __dirname for ES modules
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Import the 'path' module to handle and transform file paths
import path from 'path';

// Define the file paths for various filter lists and output files
export const thirdPartyFiltersFilePath = path.join(__dirname, 'thirdPartyFilters.txt'); // Path to the third-party filters file
export const mergedFilePath = path.join(__dirname, 'merged.txt'); // Path to the merged AdGuard rules file
export const browserRulesFilePath = path.join(__dirname, 'browserRules.txt'); // Path to the browser rules file
export const outputFilePath = path.join(__dirname, 'output.txt'); // Path to the output file for logging
export const adguardFilePath = path.join(__dirname, 'adguard.txt'); // Path to the AdGuard rules file
export const personalListFilePath = path.join(__dirname, 'personalList.txt'); // Path to the personal list file
export const hostsFilePath = path.join(__dirname, 'hosts.txt'); // Path to the hosts rules file
export const combinedFilePath = path.join(__dirname, 'combined.txt'); // Path to the combined browser and AdGuard rules file