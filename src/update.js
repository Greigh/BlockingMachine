import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logMessage } from './utils/log.js';
import {
    updateAllLists,
    ensureFiltersFileExists,
    writeFilterSets
} from './rules/update.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const debug = process.argv.includes('-debug');
const verbose = process.argv.includes('-verbose');

async function cleanAllRules() {
    const files = {
        browser: '../browserRules.txt',
        adguard: '../adguard.txt',
        adguardDns: '../adguard_dnsrewrite.txt',
        hosts: '../hosts.txt'
    };

    try {
        // Create sets to store cleaned rules
        const sets = {
            hostsSet: new Set(),
            adGuardSet: new Set(),
            noDnsRewriteSet: new Set(),
            browserRulesSet: new Set(),
            combinedSet: new Set()
        };

        // Read and clean each file
        for (const [type, filePath] of Object.entries(files)) {
            const fullPath = path.resolve(__dirname, filePath);

            // Ensure file exists
            await fs.access(fullPath).catch(async () => {
                await fs.writeFile(fullPath, '', 'utf8');
                await logMessage(`Created missing file: ${filePath}`, debug);
            });

            const content = await fs.readFile(fullPath, 'utf8');

            // Filter rules and add to appropriate sets
            const lines = content.split('\n').filter(line => {
                const trimmed = line.trim();
                return trimmed &&
                    !trimmed.startsWith('#') &&
                    !trimmed.startsWith('!') &&
                    !trimmed.startsWith('//');
            });

            switch (type) {
            case 'hosts':
                lines.forEach(line => sets.hostsSet.add(line));
                break;
            case 'adguard':
                lines.forEach(line => sets.noDnsRewriteSet.add(line));
                break;
            case 'adguardDns':
                lines.forEach(line => sets.adGuardSet.add(line));
                break;
            case 'browser':
                lines.forEach(line => sets.browserRulesSet.add(line));
                break;
            }
        }

        // Write files with headers using writeFilterSets
        await writeFilterSets(sets);
        await logMessage('Successfully cleaned and wrote all rules', verbose);

    } catch (error) {
        await logMessage(`Error cleaning rules: ${error.message}`, debug);
        console.error(error.stack);
    }
}

async function main() {
    try {
        if (debug) {
            console.log('Starting update process');
        }

        await cleanAllRules();
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