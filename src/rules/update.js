// Import required modules
import fs from 'fs';
import { fetchText } from '../utils/fetch.js';
import { logMessage } from '../utils/log.js';
import { convertToAdGuardRule } from './convert.js';
import {
    combinedFilePath,
    thirdPartyFiltersFilePath,
    mergedFilePath,
    browserRulesFilePath,
    outputFilePath,
    adguardFilePath,
    personalListFilePath,
    hostsFilePath
} from '../utils/paths.js';

/**
 * Reads filter URLs from thirdPartyFilters.txt (one URL per line).
 * 
 * @param {boolean} debug - Flag to enable debug logging.
 * @param {boolean} verbose - Flag to enable verbose logging.
 * @returns {Promise<string[]>} - An array of filter URLs.
 */
async function loadFilterUrls(debug, verbose) {
    try {
        // Log the start of reading filter URLs
        await logMessage('Reading filter URLs from thirdPartyFilters.txt', verbose);
        // Read the content of thirdPartyFilters.txt
        const fileContent = await fs.promises.readFile(thirdPartyFiltersFilePath, { encoding: 'utf8' });
        // Split the content by new lines, trim each line, and filter out empty lines
        const FILTER_URLS = fileContent
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line); // Remove empty lines
        // Log the loaded filter URLs
        await logMessage('Loaded filter URLs: ' + FILTER_URLS.join(', '), verbose);
        return FILTER_URLS;
    } catch (err) {
        // Log any errors encountered while reading thirdPartyFilters.txt
        await logMessage('Error reading thirdPartyFilters.txt: ' + err.message, debug);
        console.error(err.stack);
        return [];
    }
}

/**
 * Helper function to add rules to sets.
 * 
 * @param {string} line - The original rule line.
 * @param {string} rule - The converted AdGuard rule.
 * @param {string} noDnsRewriteRule - The converted AdGuard rule without DNS rewrite.
 * @param {object} sets - The sets to add the rules to.
 */
function addRuleToSets(line, rule, noDnsRewriteRule, sets) {
    const { adGuardSet, noDnsRewriteSet, personalListSet, combinedSet, browserRulesSet, hostsSet } = sets;

    // Check if the line is an AdGuard rule or exception rule
    if (line.trim().startsWith('||') || line.trim().startsWith('@@||')) {
        // Check if the rule contains specific characters indicating an AdGuard rule
        if (line.trim().startsWith('||') && (line.trim().includes('^$') || line.trim().includes('$') || line.trim().includes('/'))) {
            adGuardSet.add(line.trim());
            noDnsRewriteSet.add(noDnsRewriteRule);
            personalListSet.add(line.trim());
            combinedSet.add(line.trim());
        } else {
            const trimmedLine = line.trim();
            const parts = trimmedLine.split('||');
            if (parts.length > 1) {
                const domain = parts[1].split('^')[0];
                const adGuardRule = `||${domain}^$dnsrewrite=ad-block.dns.adguard.com`;
                const exceptionRule = `@@||${domain}^`;
                if (line.trim().startsWith('||')) {
                    if (!adGuardSet.has(exceptionRule)) {
                        adGuardSet.add(adGuardRule);
                        noDnsRewriteSet.add(noDnsRewriteRule);
                        personalListSet.add(adGuardRule);
                        combinedSet.add(adGuardRule);
                    }
                } else if (line.trim().startsWith('@@||')) {
                    if (!adGuardSet.has(adGuardRule)) {
                        adGuardSet.add(line.trim());
                        noDnsRewriteSet.add(noDnsRewriteRule);
                        personalListSet.add(line.trim());
                        combinedSet.add(line.trim());
                    }
                }
            }
        }
    } else {
        // Add browser rules and host rules
        browserRulesSet.add(line.trim());
        combinedSet.add(line.trim());
        if (line.startsWith('0.0.0.0') || line.startsWith('127.0.0.1')) {
            hostsSet.add(line.trim());
        }
    }
}

/**
 * Helper function to generate metadata comments.
 * 
 * @param {string} type - The type of the list (e.g., AdGuard, Browser).
 * @param {number} count - The number of entries in the list.
 * @returns {string} - The generated metadata comment.
 */
function generateMetadataComment(type, count) {
    const updatedOn = new Date().toISOString().split('T')[0];
    return `! Title: BlockingMachine
! Expires: 1 days
! Description: 
! Homepage: https://github.com/greigh/blockingmachine
! License: 
! Please report any unblocked content or problems on GitHub
!
! This list covers all Aglinting rules
! Type: ${type}
! Entries: ${count}
! Updated On: ${updatedOn}
! Created by: Greigh (aka Daniel)
`;
}

/**
 * Update all lists by fetching and processing filter URLs.
 * 
 * @param {boolean} debug - Flag to enable debug logging.
 * @param {boolean} verbose - Flag to enable verbose logging.
 */
export async function updateAllLists(debug, verbose) {
    await logMessage('Starting updateAllLists', verbose);
    const FILTER_URLS = await loadFilterUrls(debug, verbose);
    if (FILTER_URLS.length === 0) {
        await logMessage('No filter URLs found.', debug);
        return;
    }
    try {
        // Fetch the content of each filter URL
        const results = await Promise.all(FILTER_URLS.map(url => fetchText(url, 3, debug, verbose)));
        const adGuardSet = new Set();
        const browserRulesSet = new Set();
        const noDnsRewriteSet = new Set();
        const personalListSet = new Set();
        const hostsSet = new Set();
        const combinedSet = new Set(); // New set for combined rules

        const sets = { adGuardSet, browserRulesSet, noDnsRewriteSet, personalListSet, hostsSet, combinedSet };

        // Process each line of the fetched filter lists
        for (let txt of results) {
            const lines = txt.split(/\r?\n/);
            for (let line of lines) {
                const trimmedLine = line.trim();
                if (
                    !trimmedLine ||
                    trimmedLine.startsWith('#') ||
                    trimmedLine.startsWith('!') ||
                    trimmedLine.startsWith('[') ||
                    trimmedLine.startsWith('//') ||
                    trimmedLine.startsWith('<') ||
                    trimmedLine.startsWith('/*') ||
                    trimmedLine.startsWith('*/') ||
                    trimmedLine.startsWith('##') ||
                    trimmedLine.startsWith('*')
                ) {
                    continue;
                }
                const rule = await convertToAdGuardRule(trimmedLine);
                const noDnsRewriteRule = await convertToAdGuardRule(trimmedLine, false);
                addRuleToSets(trimmedLine, rule, noDnsRewriteRule, sets);
            }
        }

        // Generate metadata comments and content for each list
        const adGuardCount = adGuardSet.size;
        const browserRulesCount = browserRulesSet.size;
        const noDnsRewriteCount = noDnsRewriteSet.size;
        const personalListCount = personalListSet.size;
        const hostsCount = hostsSet.size;
        const combinedCount = combinedSet.size; // Count for combined rules

        const adGuardContent = generateMetadataComment('AdGuard', adGuardCount) + [...adGuardSet].join('\n');
        const browserRulesContent = generateMetadataComment('Browser', browserRulesCount) + [...browserRulesSet].join('\n');
        const noDnsRewriteContent = generateMetadataComment('No DNS Rewrite', noDnsRewriteCount) + [...noDnsRewriteSet].join('\n');
        const personalListContent = generateMetadataComment('Personal', personalListCount) + [...personalListSet].join('\n');
        const hostsContent = generateMetadataComment('Hosts', hostsCount) + [...hostsSet].join('\n');
        const combinedContent = generateMetadataComment('Combined', combinedCount) + [...combinedSet].join('\n');

        // Write the content to respective files
        await fs.promises.writeFile(mergedFilePath, adGuardContent, 'utf8');
        await fs.promises.writeFile(browserRulesFilePath, browserRulesContent, 'utf8');
        await fs.promises.writeFile(adguardFilePath, noDnsRewriteContent, 'utf8');
        await fs.promises.writeFile(personalListFilePath, personalListContent, 'utf8');
        await fs.promises.writeFile(hostsFilePath, hostsContent, 'utf8');
        await fs.promises.writeFile(combinedFilePath, combinedContent, 'utf8'); // Write combined set to file

        await logMessage('Combined AdGuard list and browser rules updated successfully.', verbose);
        if (debug) {
            await logMessage('AdGuard rules: ' + [...adGuardSet].join(', '), verbose);
            await logMessage('Browser rules: ' + [...browserRulesSet].join(', '), verbose);
            await logMessage('No DNS Rewrite rules: ' + [...noDnsRewriteSet].join(', '), verbose);
            await logMessage('Personal list: ' + [...personalListSet].join(', '), verbose);
            await logMessage('Hosts rules: ' + [...hostsSet].join(', '), verbose);
            await logMessage('Combined rules: ' + [...combinedSet].join(', '), verbose); // Log combined rules
        }

        // Write rule counts to output.txt
        const outputContent = `AdGuard rules count: ${adGuardCount}\nBrowser rules count: ${browserRulesCount}\nNo DNS Rewrite rules count: ${noDnsRewriteCount}\nPersonal list count: ${personalListCount}\nHosts rules count: ${hostsCount}\nCombined rules count: ${combinedCount}\n`;
        await fs.promises.writeFile(outputFilePath, outputContent, 'utf8');
        await logMessage('Rule counts written to output.txt', verbose);
    } catch (err) {
        await logMessage(`Error updating lists: ${err.message}`, debug);
        console.error(err.stack);
        if (err.code === 'ENOENT') {
            await logMessage('File not found: ' + err.message, debug);
        } else if (err.code === 'EACCES') {
            await logMessage('Permission denied: ' + err.message, debug);
        } else if (err.response) {
            await logMessage(`Network error: ${err.response.status} ${err.response.statusText}`, debug);
        } else {
            await logMessage(`Update error: ${err.message}`, debug);
        }
    }
}

/**
 * Ensure thirdPartyFilters.txt and browserRules.txt files exist.
 * 
 * @param {boolean} debug - Flag to enable debug logging.
 * @param {boolean} verbose - Flag to enable verbose logging.
 */
export async function ensureFiltersFileExists(debug, verbose) {
    try {
        await logMessage('Checking if thirdPartyFilters.txt exists', verbose);
        await fs.promises.access(thirdPartyFiltersFilePath);
        await logMessage('thirdPartyFilters.txt exists', verbose);
    } catch (err) {
        await logMessage(`Error checking thirdPartyFilters.txt: ${err.message}`, debug);
        if (err.code === 'ENOENT') {
            await logMessage('thirdPartyFilters.txt does not exist, creating with default URLs', debug);
            const defaultUrls = [
                'https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/MobileFilter/sections/adservers.txt',
                'https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/AWAvenue-Ads-Rule.txt',
            ];
            try {
                await fs.promises.writeFile(thirdPartyFiltersFilePath, defaultUrls.join('\n'), 'utf8');
                await logMessage('Created thirdPartyFilters.txt with default URLs', verbose);
            } catch (writeErr) {
                await logMessage(`Error creating thirdPartyFilters.txt: ${writeErr.message}`, debug);
            }
        } else {
            await logMessage('Error checking thirdPartyFilters.txt: ' + err.message, debug);
        }
    }

    try {
        await logMessage('Checking if browserRules.txt exists', verbose);
        await fs.promises.access(browserRulesFilePath);
        await logMessage('browserRules.txt exists', verbose);
    } catch (err) {
        await logMessage(`Error checking browserRules.txt: ${err.message}`, debug);
        if (err.code === 'ENOENT') {
            await logMessage('browserRules.txt does not exist, creating an empty file', debug);
            try {
                await fs.promises.writeFile(browserRulesFilePath, '', 'utf8');
                await logMessage('Created browserRules.txt', verbose);
            } catch (writeErr) {
                await logMessage(`Error creating browserRules.txt: ${writeErr.message}`, debug);
            }
        } else {
            await logMessage('Error checking browserRules.txt: ' + err.message, debug);
        }
    }
}