import { promises as fs } from 'fs';
import { resolve } from 'path';
import { logMessage } from './utils/log.js';
import {
    updateAllLists,
    ensureFiltersFileExists,
    writeFilterSets
} from './rules/update.js';
import {
    browserRulesFilePath,
    adguardFilePath,
    adguardDnsrewriteFilePath,
    hostsFilePath
} from './utils/paths.js';

const debug = process.argv.includes('-debug');
const verbose = process.argv.includes('-verbose');

async function cleanAllRules() {
    const files = {
        browser: browserRulesFilePath,
        adguard: adguardFilePath,
        adguardDns: adguardDnsrewriteFilePath,
        hosts: hostsFilePath
    };

    try {
        const sets = {
            hostsSet: new Set(),
            adGuardSet: new Set(),
            noDnsRewriteSet: new Set(),
            browserRulesSet: new Set(),
            combinedSet: new Set()
        };

        // Read and clean each file
        for (const [type, filePath] of Object.entries(files)) {
            // Ensure file exists
            await fs.access(filePath).catch(async () => {
                await fs.writeFile(filePath, '', 'utf8');
                await logMessage(`Created missing file: ${filePath}`, debug);
            });

            const content = await fs.readFile(filePath, 'utf8');

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