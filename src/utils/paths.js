// Import the 'path' module to handle and transform file paths
const path = require('path');

// Define the file paths for various filter lists and output files
const thirdPartyFiltersFilePath = path.resolve(__dirname, '../../thirdPartyFilters.txt'); // Path to the third-party filters file
const mergedFilePath = path.resolve(__dirname, '../../adguard_merged.txt'); // Path to the merged AdGuard rules file
const browserRulesFilePath = path.resolve(__dirname, '../../browserRules.txt'); // Path to the browser rules file
const outputFilePath = path.resolve(__dirname, '../../output.txt'); // Path to the output file for logging
const adguardFilePath = path.resolve(__dirname, '../../adguard.txt'); // Path to the AdGuard rules file
const personalListFilePath = path.resolve(__dirname, '../../personal_list.txt'); // Path to the personal list file
const hostsFilePath = path.resolve(__dirname, '../../hosts.txt'); // Path to the hosts rules file
const combinedFilePath = path.resolve(__dirname, '../../browserAndAdGuard.txt'); // Path to the combined browser and AdGuard rules file

// Export the file paths as a module
module.exports = {
    thirdPartyFiltersFilePath,
    mergedFilePath,
    browserRulesFilePath,
    outputFilePath,
    adguardFilePath,
    personalListFilePath,
    hostsFilePath,
    combinedFilePath
};