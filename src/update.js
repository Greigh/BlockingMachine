import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logMessage } from './utils/log.js';
import { updateAllLists, ensureFiltersFileExists } from './rules/update.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const debug = process.argv.includes('-debug');
const verbose = process.argv.includes('-verbose');

async function cleanBrowserRules() {
    try {
        const filePath = path.resolve(__dirname, '../browserRules.txt');
        const content = await fs.readFile(filePath, 'utf8');

        const excludePatterns = [
            /###cookie-modal$/,
            /##\.cookie-modal$/
        ];

        const lines = content.split('\n');
        const cleanedLines = lines.filter(line => {
            return !excludePatterns.some(pattern => pattern.test(line));
        });

        await fs.writeFile(filePath, cleanedLines.join('\n'));
        await logMessage('Successfully cleaned browser rules', verbose);
    } catch (error) {
        await logMessage('Error cleaning browser rules: ' + error.message, debug);
        console.error(error.stack);
    }
}

async function main() {
    try {
        if (debug) {
            console.log('Starting update process');
        }

        await cleanBrowserRules();
        await ensureFiltersFileExists(debug, verbose);
        await updateAllLists(debug, verbose);

        if (debug) {
            console.log('Update process finished');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error occurred:', error);
        process.exit(1);
    }
}

main();