// Import required modules
import fs from 'fs';
import { fetchText } from '../utils/fetch.js';
import { logMessage } from '../utils/log.js';
import { convertToAdGuardRule } from './convert.js';
import {
    thirdPartyFiltersFilePath,
    adguardDnsrewriteFilePath, // Changed from mergedFilePath
    browserRulesFilePath,
    outputFilePath,
    adguardFilePath,
    hostsFilePath
} from '../utils/paths.js';

// Configuration constants
const LICENSE = 'MIT';
const excludePatterns = [
    /###cookie-modal$/,
    /##\.cookie-modal$/,
    /##\.Cookie/,
    /##\.cookie/,
    /###cookie/,
    /###Cookie/
];

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
    const { adGuardSet, noDnsRewriteSet, combinedSet, browserRulesSet, hostsSet } = sets;
    const trimmedLine = line.trim();

    // Handle hosts rules first
    if (trimmedLine.startsWith('0.0.0.0') || trimmedLine.startsWith('127.0.0.1')) {
        hostsSet.add(trimmedLine);
        combinedSet.add(trimmedLine);
        return;
    }

    // Handle AdGuard rules
    if (trimmedLine.startsWith('||') || trimmedLine.startsWith('@@||')) {
        if (trimmedLine.startsWith('||') && (trimmedLine.includes('^$') || trimmedLine.includes('$') || trimmedLine.includes('/'))) {
            adGuardSet.add(trimmedLine);
            noDnsRewriteSet.add(noDnsRewriteRule);
            combinedSet.add(trimmedLine);
        } else {
            const parts = trimmedLine.split('||');
            if (parts.length > 1) {
                const domain = parts[1].split('^')[0];
                const hostRule = `0.0.0.0 ${domain}`;
                hostsSet.add(hostRule);

                const adGuardRule = `||${domain}^$dnsrewrite=ad-block.dns.adguard.com`;
                const exceptionRule = `@@||${domain}^`;

                if (trimmedLine.startsWith('||')) {
                    if (!adGuardSet.has(exceptionRule)) {
                        adGuardSet.add(adGuardRule);
                        noDnsRewriteSet.add(noDnsRewriteRule);
                        combinedSet.add(adGuardRule);
                    }
                }
            }
        }
    } else {
        // Browser rules
        browserRulesSet.add(trimmedLine);
        combinedSet.add(trimmedLine);
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
    const now = new Date();
    const updatedOn = now.toISOString()
        .replace('T', ' ')
        .replace(/\.\d+Z$/, '');

    return `! Title: BlockingMachine
! Expires: 1 days
! Description: Filter rules for blocking unwanted content
! Homepage: https://github.com/greigh/blockingmachine
! License: ${LICENSE}
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
 * Filter and count rules in a file, excluding comments and empty lines
 * @param {string} filePath - The path to the file to process
 * @param {boolean} debug - Enable debug logging
 * @param {boolean} verbose - Enable verbose logging
 * @returns {Promise<number>} - The number of valid rules
 */
export async function filterRules(filePath, debug, verbose) {
    try {
        const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf8' });
        const lines = fileContent.split(/\r?\n/);

        const validRules = lines.filter(line => {
            const trimmedLine = line.trim();
            return trimmedLine &&
                !trimmedLine.startsWith('#') &&
                !trimmedLine.startsWith('//') &&  // Exclude JS-style comments
                !trimmedLine.startsWith('!') &&   // Exclude AdGuard comments
                !trimmedLine.startsWith('[') &&   // Exclude section headers
                !excludePatterns.some(pattern => pattern.test(trimmedLine));
        });

        // Write filtered content back with proper line endings
        await fs.promises.writeFile(filePath, validRules.join('\n') + '\n');
        await logMessage(`Filtered and wrote ${validRules.length} rules to ${filePath}`, verbose);
        return validRules.length;
    } catch (err) {
        await logMessage(`Error filtering rules: ${err.message}`, debug);
        return 0;
    }
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
        const hostsSet = new Set();
        const combinedSet = new Set();

        const sets = { adGuardSet, browserRulesSet, noDnsRewriteSet, hostsSet, combinedSet };

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
        const hostsCount = hostsSet.size;
        const combinedCount = combinedSet.size;

        const adGuardContent = generateMetadataComment('AdGuard', adGuardCount) + [...adGuardSet].join('\n');
        const browserRulesContent = generateMetadataComment('Browser', browserRulesCount) + [...browserRulesSet].join('\n');
        const noDnsRewriteContent = generateMetadataComment('No DNS Rewrite', noDnsRewriteCount) + [...noDnsRewriteSet].join('\n');
        const hostsContent = generateMetadataComment('Hosts', hostsCount) + [...hostsSet].join('\n');

        // Write the content to respective files
        await fs.promises.writeFile(adguardDnsrewriteFilePath, adGuardContent, 'utf8');
        await fs.promises.writeFile(browserRulesFilePath, browserRulesContent, 'utf8');
        await fs.promises.writeFile(adguardFilePath, noDnsRewriteContent, 'utf8');
        await fs.promises.writeFile(hostsFilePath, hostsContent, 'utf8');

        await logMessage('AdGuard list and browser rules updated successfully.', verbose);
        if (debug) {
            await logMessage('AdGuard rules: ' + [...adGuardSet].join(', '), verbose);
            await logMessage('Browser rules: ' + [...browserRulesSet].join(', '), verbose);
            await logMessage('No DNS Rewrite rules: ' + [...noDnsRewriteSet].join(', '), verbose);
            await logMessage('Hosts rules: ' + [...hostsSet].join(', '), verbose);
        }

        // Write rule counts to output.txt
        const outputContent = `AdGuard rules count: ${adGuardCount}\nBrowser rules count: ${browserRulesCount}\nNo DNS Rewrite rules count: ${noDnsRewriteCount}\nHosts rules count: ${hostsCount}\nCombined rules count: ${combinedCount}\n`;
        await fs.promises.writeFile(outputFilePath, outputContent, 'utf8');
        await logMessage('Rule counts written to output.txt', verbose);

        // Filter rules after processing
        await filterRules(browserRulesFilePath, debug, verbose);
        await filterRules(adguardFilePath, debug, verbose);
        await filterRules(hostsFilePath, debug, verbose);

        await logMessage('All files filtered successfully', verbose);
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