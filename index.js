'use strict';
const process = require('process');
const blockMachine = require('./BlockingMachine');
const fs = require('fs');
const path = require('path');

const debug = process.argv.includes('-debug');
const verbose = process.argv.includes('-verbose');
const outputFilePath = path.resolve(path.dirname(require.main.filename), 'output.txt');

// Helper function to log messages
async function logMessage(message, verbose, alwaysLog = false) {
    if (!verbose && !alwaysLog) return; // Prevent logging if verbose is not flagged and alwaysLog is false
    await fs.promises.appendFile(outputFilePath, message + '\n', 'utf8');
}

if (debug) {
    console.log('Script execution started');
}

(async () => {
    if (debug) {
        console.log('Starting script');
    }
    try {
        await blockMachine.ensureFiltersFileExists(debug, verbose, logMessage);
        await blockMachine.updateAllLists(debug, verbose, logMessage);
        if (debug) {
            console.log('Script finished');
        }
    } catch (error) {
        console.error('Error occurred:', error);
    }
})();

if (debug) {
    console.log('Script execution ended');
}