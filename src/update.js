import { promises as fs } from 'fs';
import { logMessage } from './utils/log.js';
import { fetchData } from './utils/fetch.js';
import {
    updateAllLists,
    ensureFiltersFileExists,
    writeFilterSets
} from './rules/update.js';
import {
    browserRulesFilePath,
    adguardFilePath,
    adguardDnsrewriteFilePath,
    hostsFilePath,
    thirdPartyFiltersFilePath
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

async function fetchThirdPartyFilters() {
    try {
        const content = await fs.readFile(thirdPartyFiltersFilePath, 'utf8');
        const urls = content.split('\n').filter(url => url.trim() && !url.startsWith('#'));

        console.log('Fetching third-party filters from:', urls);

        const responses = await Promise.all(
            urls.map(async url => {
                try {
                    const response = await fetchData(url);
                    return response;
                } catch (error) {
                    return '';
                }
            })
        );

        const combined = responses.join('\n');
        console.log(`Total third-party rules: ${combined.split('\n').length}`);
        return combined;
    } catch (error) {
        console.error('Error fetching third-party filters:', error);
        throw error;
    }
}

async function update() {
    try {
        // First, get third-party filters
        const thirdPartyContent = await fetchThirdPartyFilters();

        // Combine with existing rules
        const existingRules = await fs.readFile(adguardFilePath, 'utf8');
        const combinedRules = existingRules + '\n' + thirdPartyContent;

        // Process and deduplicate rules
        const uniqueRules = new Set(
            combinedRules.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('!') && !line.startsWith('#'))
        );

        // Write back to files
        await fs.writeFile(adguardFilePath, Array.from(uniqueRules).join('\n') + '\n');
        await logMessage(`Updated rules with ${uniqueRules.size} unique entries`);

        // Continue with rest of update process...
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
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

export { update, fetchThirdPartyFilters };