'use strict';

import { logMessage } from './utils/log.js';
import express from 'express';
import bodyParser from 'body-parser';
import * as fsSync from 'fs';
import { updateAllLists, ensureFiltersFileExists } from './rules/update.js';
import { promises as fs } from 'fs';
import {
    outputFilePath,
    browserRulesFilePath
} from './utils/paths.js';

const excludePatterns = [
    /###cookie-modal$/,
    /##\.cookie-modal$/
];

async function cleanBrowserRules() {
    try {
        const content = await fs.readFile(browserRulesFilePath, 'utf8');

        // Split into lines and filter out excluded patterns
        const lines = content.split('\n');
        const cleanedLines = lines.filter(line => {
            return !excludePatterns.some(pattern => pattern.test(line));
        });

        // Write back to original file
        await fs.writeFile(browserRulesFilePath, cleanedLines.join('\n'));
        await logMessage('Successfully cleaned browser rules', verbose);
    } catch (error) {
        await logMessage('Error cleaning browser rules: ' + error.message, debug);
        console.error(error.stack);
    }
}

// Check for debug and verbose flags in the command line arguments
const debug = process.argv.includes('-debug');
const verbose = process.argv.includes('-verbose');

// Clear the output file before every run
fsSync.writeFileSync(outputFilePath, '', 'utf8');

async function main() {
    try {
        if (debug) {
            console.log('Starting script');
        }

        // Clean browser rules first
        await cleanBrowserRules();

        // Then proceed with existing operations
        await ensureFiltersFileExists(debug, verbose);
        await updateAllLists(debug, verbose);

        if (debug) {
            console.log('Script finished');
        }

        // Exit after updates if not running as server
        if (!process.argv.includes('--server')) {
            process.exit(0);
        }
    } catch (error) {
        console.error('Error occurred:', error);
        process.exit(1);
    }
}

// Run updates
main();

// Only start server if --server flag is present
if (process.argv.includes('--server')) {
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
}