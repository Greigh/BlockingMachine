'use strict';

// Import required modules
import { logMessage } from './utils/log.js';
import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import { mergedFilePath, browserRulesFilePath } from './utils/paths.js';
import { updateAllLists, ensureFiltersFileExists } from './rules/update.js';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check for debug and verbose flags in the command line arguments
const debug = process.argv.includes('-debug');
const verbose = process.argv.includes('-verbose');

// Define the path to the output file
const outputFilePath = path.resolve(dirname(__filename), 'output.txt');

// Define file paths for various filter lists
const filtersFilePath = path.resolve(__dirname, 'filters.txt');

// Clear the output file before every run
fsSync.writeFileSync(outputFilePath, '', 'utf8');

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
        const fileContent = await fs.readFile(filtersFilePath, { encoding: 'utf8' });
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

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.send('Blocking Machine is running!');
});

// Start server
app.listen(port, () => {
    logMessage(`Server is running on port ${port}`);
});

// Handle process events
process.on('SIGTERM', () => {
    logMessage('Received SIGTERM. Performing graceful shutdown...', 'warn');
    process.exit(0);
});

process.on('SIGINT', () => {
    logMessage('Received SIGINT. Performing graceful shutdown...', 'warn');
    process.exit(0);
});