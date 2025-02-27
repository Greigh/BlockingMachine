// Import required modules
import { promises as fs } from 'fs';  // Make sure fs is installed
import { fetchText } from '../utils/fetch.js';
import { logMessage } from '../utils/log.js';
import { convertToAdGuardRule, convertToBrowserRule, convertToHostsRule } from './convert.js';
import {
    thirdPartyFiltersFilePath,
    adguardDnsrewriteFilePath,
    browserRulesFilePath,
    adguardFilePath,
    hostsFilePath
} from '../utils/paths.js';

// Configuration constants
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
        const fileContent = await fs.readFile(thirdPartyFiltersFilePath, { encoding: 'utf8' });
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
 * @param {object} sets - The sets to add the rules to.
 */
async function addRuleToSets(line, sets) {
    const { hostsSet, adGuardSet, noDnsRewriteSet, browserRulesSet, combinedSet } = sets;
    const trimmedLine = line.trim();

    // Debug logging
    console.log('Processing rule:', trimmedLine);

    // Skip empty lines and comments, but keep metadata
    if (!trimmedLine ||
        (trimmedLine.startsWith('#') && !trimmedLine.includes('0.0.0.0')) ||
        trimmedLine.startsWith('!') ||
        trimmedLine.startsWith('//')) {
        return;
    }

    // Preserve existing DNS rewrite rules
    if (trimmedLine.includes('$dnsrewrite')) {
        adGuardSet.add(trimmedLine);
        combinedSet.add(trimmedLine);
        console.log('Added DNS rewrite rule:', trimmedLine);
        return;
    }

    // Convert and add rules to appropriate sets
    try {
        const hostsRule = await convertToHostsRule(trimmedLine);
        const adGuardRule = await convertToAdGuardRule(trimmedLine, true);
        const noRewriteRule = await convertToAdGuardRule(trimmedLine, false);
        const browserRule = await convertToBrowserRule(trimmedLine);

        // Log conversions
        console.log('Rule conversions:', {
            original: trimmedLine,
            hosts: hostsRule,
            adGuard: adGuardRule,
            noRewrite: noRewriteRule,
            browser: browserRule
        });

        // Add to appropriate sets if valid
        if (hostsRule) hostsSet.add(hostsRule);
        if (adGuardRule) adGuardSet.add(adGuardRule);
        if (noRewriteRule) noDnsRewriteSet.add(noRewriteRule);
        if (browserRule) browserRulesSet.add(browserRule);

        // Add to combined set based on priority
        if (adGuardRule) {
            combinedSet.add(adGuardRule);
        } else if (browserRule) {
            combinedSet.add(browserRule);
        } else if (hostsRule) {
            combinedSet.add(hostsRule);
        }
    } catch (error) {
        console.error('Error processing rule:', trimmedLine, error);
    }
}

/**
 * Generate metadata header for filter lists
 * @param {string} type - The type of list (AdGuard, Browser, Hosts)
 * @param {number} count - Number of rules in the list
 * @returns {string} Formatted metadata header
 */
export function generateMetadata(type, count) {
    if (!type || typeof count !== 'number') {
        console.error('Invalid metadata parameters:', { type, count });
        return '';
    }

    const now = new Date().toISOString()
        .replace('T', ' ')
        .replace(/\.\d+Z$/, '');

    const commentChar = type.toLowerCase().includes('hosts') ? '#' : '!';

    // Create description based on filter type
    let description;
    switch (type) {
        case 'AdGuard Standard':
            description = 'Enhanced privacy protection filter list for blocking ads, trackers, annoyances, and pop-ups. ' +
                'Includes domain-level blocking and custom rules to improve browsing experience.';
            break;
        case 'AdGuard DNS':
            description = 'DNS rewrite filter rules for blocking ads, trackers, and annoyances at the DNS level. ' +
                'Enhances privacy by preventing unwanted connections with custom DNS responses.';
            break;
        case 'Browser':
            description = 'Browser-compatible filter rules for blocking ads, trackers, and annoyances. ' +
                'Optimized for browser extensions and includes element hiding rules.';
            break;
        case 'Hosts':
            description = 'Host-level domain blocking rules to prevent connections to ad servers, trackers, and malicious domains. ' +
                'Blocks unwanted traffic at the system level by redirecting domains to 0.0.0.0.';
            break;
        default:
            description = 'Domain blocking rules for blocking ads and trackers';
    }

    return `${commentChar} Title: BlockingMachine ${type} Filter List
${commentChar} Description: ${description}
${commentChar} Homepage: https://github.com/greigh/BlockingMachine
${commentChar} Last modified: ${now}
${commentChar} Number of rules: ${count}
${commentChar}
${commentChar} Format: ${type === 'Hosts' ? '0.0.0.0 domain.tld' :
            type === 'AdGuard DNS' ? '||domain.tld^$dnsrewrite=greigh.github.io/BlockingMachine' :
                '||domain.tld^'}
${commentChar}`;
}

// Remove generateMetadataComment and generateHeaderMetadata functions

/**
 * Filter and count rules in a file, excluding comments and empty lines
 * @param {string} filePath - The path to the file to process
 * @param {boolean} debug - Enable debug logging
 * @param {boolean} verbose - Enable verbose logging
 * @returns {Promise<number>} - The number of valid rules
 */
export async function filterRules(filePath, debug, verbose) {
    try {
        const fileContent = await fs.readFile(filePath, { encoding: 'utf8' });
        const lines = fileContent.split(/\r?\n/);

        // Preserve metadata and rules
        const validRules = lines.filter(line => {
            const trimmedLine = line.trim();

            // Keep metadata lines
            if (trimmedLine.startsWith('!') &&
                (trimmedLine.includes('Title:') ||
                    trimmedLine.includes('Description:') ||
                    trimmedLine.includes('Homepage:') ||
                    trimmedLine.includes('Last modified:') ||
                    trimmedLine.includes('Number of rules:') ||
                    trimmedLine.includes('Format:'))) {
                return true;
            }

            // Keep valid rules
            return trimmedLine &&
                !trimmedLine.startsWith('//') &&
                !(trimmedLine.startsWith('#') && !trimmedLine.includes('0.0.0.0')) &&
                !excludePatterns.some(pattern => pattern.test(trimmedLine));
        });

        await fs.writeFile(filePath, validRules.join('\n') + '\n');
        const ruleCount = validRules.filter(line => {
            const trimmed = line.trim();
            return trimmed &&
                !trimmed.startsWith('!') &&
                !(trimmed.startsWith('#') && !trimmed.includes('0.0.0.0'));
        }).length;

        await logMessage(`Filtered and wrote ${ruleCount} rules to ${filePath}`, verbose);
        return ruleCount;
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
        // Create sets to store rules
        const sets = {
            hostsSet: new Set(),
            adGuardSet: new Set(),
            noDnsRewriteSet: new Set(),
            browserRulesSet: new Set(),
            combinedSet: new Set()
        };

        // Fetch and process rules
        const results = await Promise.all(
            FILTER_URLS.map(url => fetchText(url, 3, debug, verbose))
        );

        // Process results and add to sets
        for (const content of results) {
            if (content) {
                const lines = content.split('\n');
                for (const line of lines) {
                    await addRuleToSets(line, sets);
                }
            }
        }

        // Write the sets to files with metadata
        await writeFilterSets(sets);

        // Log completion
        await logMessage('Successfully updated all filter lists', verbose);
    } catch (err) {
        await logMessage(`Error in updateAllLists: ${err.message}`, 'error');
        throw err;
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
        await fs.access(thirdPartyFiltersFilePath);
        await logMessage('thirdPartyFilters.txt exists', verbose);
    } catch (err) {
        await logMessage(`Error checking thirdPartyFilters.txt: ${err.message} `, debug);
        if (err.code === 'ENOENT') {
            await logMessage('thirdPartyFilters.txt does not exist, creating with default URLs', debug);
            const defaultUrls = [
                'https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/MobileFilter/sections/adservers.txt',
                'https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/AWAvenue-Ads-Rule.txt',
            ];
            try {
                await fs.writeFile(thirdPartyFiltersFilePath, defaultUrls.join('\n'), 'utf8');
                await logMessage('Created thirdPartyFilters.txt with default URLs', verbose);
            } catch (writeErr) {
                await logMessage(`Error creating thirdPartyFilters.txt: ${writeErr.message} `, debug);
            }
        } else {
            await logMessage('Error checking thirdPartyFilters.txt: ' + err.message, debug);
        }
    }

    try {
        await logMessage('Checking if browserRules.txt exists', verbose);
        await fs.access(browserRulesFilePath);
        await logMessage('browserRules.txt exists', verbose);
    } catch (err) {
        await logMessage(`Error checking browserRules.txt: ${err.message} `, debug);
        if (err.code === 'ENOENT') {
            await logMessage('browserRules.txt does not exist, creating an empty file', debug);
            try {
                await fs.writeFile(browserRulesFilePath, '', 'utf8');
                await logMessage('Created browserRules.txt', verbose);
            } catch (writeErr) {
                await logMessage(`Error creating browserRules.txt: ${writeErr.message} `, debug);
            }
        } else {
            await logMessage('Error checking browserRules.txt: ' + err.message, debug);
        }
    }
}

/**
 * Write filter sets to their respective files with metadata headers
 * @param {Object} sets - Object containing all filter sets
 */
export async function writeFilterSets(sets) {
    const { hostsSet, adGuardSet, noDnsRewriteSet, browserRulesSet } = sets;

    // Debug logging to verify set sizes
    console.log('Set sizes:', {
        hosts: hostsSet.size,
        adGuard: adGuardSet.size,
        noRewrite: noDnsRewriteSet.size,
        browser: browserRulesSet.size
    });

    const writeOperations = [
        {
            path: hostsFilePath,
            content: generateMetadata('Hosts', hostsSet.size) +
                Array.from(hostsSet).join('\n') + '\n',
            type: 'Hosts'
        },
        {
            path: adguardDnsrewriteFilePath,
            content: generateMetadata('AdGuard DNS', adGuardSet.size) +
                Array.from(adGuardSet).join('\n') + '\n',
            type: 'AdGuard DNS'
        },
        {
            path: adguardFilePath,
            content: generateMetadata('AdGuard Standard', noDnsRewriteSet.size) +
                Array.from(noDnsRewriteSet).join('\n') + '\n',
            type: 'AdGuard Standard'
        },
        {
            path: browserRulesFilePath,
            content: generateMetadata('Browser', browserRulesSet.size) +
                Array.from(browserRulesSet).join('\n') + '\n',
            type: 'Browser'
        }
    ];

    // Debug the content before writing
    for (const op of writeOperations) {
        console.log(`${op.type} metadata:`, op.content.split('\n').slice(0, 7).join('\n'));
    }

    // Execute all write operations
    await Promise.all(
        writeOperations.map(async op => {
            try {
                await fs.writeFile(op.path, op.content, 'utf8');
                await logMessage(`Successfully wrote ${op.type} rules with metadata`);
            } catch (err) {
                await logMessage(`Error writing ${op.type} rules: ${err.message}`, 'error');
                throw err;
            }
        })
    );
}