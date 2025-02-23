'use strict';

// Import required modules
import { logMessage } from './utils/log.js'; // Ensure this is used somewhere in the code
import axios from 'axios'; // Ensure this is used somewhere in the code

// Define __dirname for ES modules
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

import { mergedFilePath, browserRulesFilePath } from './utils/paths.js'; // Ensure these are used somewhere in the code

const process = require('process');
const { updateAllLists, ensureFiltersFileExists } = require('./rules/update'); // Import functions from update.js
const fs = require('fs');
const path = require('path');

// Check for debug and verbose flags in the command line arguments
const debug = process.argv.includes('-debug');
const verbose = process.argv.includes('-verbose');

// Define the path to the output file
const outputFilePath = path.resolve(path.dirname(require.main.filename), 'output.txt');

// Define file paths for various filter lists
const filtersFilePath = path.resolve(__dirname, 'filters.txt'); // File path for filters.txt

// Clear the output file before every run
fs.writeFileSync(outputFilePath, '', 'utf8');

// Array to store filter URLs
let FILTER_URLS = [];

/**
 * Reads filter URLs from filters.txt (one URL per line).
 * 
 * @param {boolean} debug - Flag to enable debug logging.
 * @param {boolean} verbose - Flag to enable verbose logging.
 * @param {function} logMessage - Function to log messages.
 */
async function loadFilterUrls(debug, verbose, logMessage) {
    try {
        // Log the start of reading filter URLs
        await logMessage('Reading filter URLs from filters.txt', verbose);
        // Read the content of filters.txt
        const fileContent = await fs.promises.readFile(filtersFilePath, { encoding: 'utf8' });
        // Split the content by new lines, trim each line, and filter out empty lines
        FILTER_URLS = fileContent
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line); // Remove empty lines
        // Log the loaded filter URLs
        await logMessage('Loaded filter URLs: ' + FILTER_URLS.join(', '), verbose);
    } catch (err) {
        // Log any errors encountered while reading filters.txt
        await logMessage('Error reading filters.txt: ' + err.message, debug);
        console.error(err.stack);
    }
}

// Immediately Invoked Function Expression (IIFE) to run the script
(async () => {
    if (debug) {
        console.log('Starting script');
    }
    try {
        // Ensure necessary filter files exist
        await ensureFiltersFileExists(debug, verbose);
        // Update all lists by fetching and processing filter URLs
        await updateAllLists(debug, verbose);
        if (debug) {
            console.log('Script finished');
        }
    } catch (error) {
        // Log any errors encountered during the script execution
        console.error('Error occurred:', error);
    }
})();