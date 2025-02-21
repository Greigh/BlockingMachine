'use strict';
const axios = require('axios'); // Import axios for making HTTP requests
const path = require('path'); // Import path for handling file paths
const fs = require('fs'); // Import fs for file system operations

// Define file paths
const filtersFilePath = path.resolve(__dirname, 'filters.txt'); // File path for filters.txt
const mergedFilePath = path.resolve(__dirname, 'adguard_merged.txt'); // File path for adguard_merged.txt
const browserRulesFilePath = path.resolve(__dirname, 'browserRules.txt'); // File path for browserRules.txt
const outputFilePath = path.resolve(__dirname, 'output.txt'); // File path for output.txt

// Clear the output file before every run
fs.writeFileSync(outputFilePath, '', 'utf8');

let FILTER_URLS = []; // Array to store filter URLs

// Helper function to log messages
async function logMessage(message, verbose, alwaysLog = false) {
    if (!verbose && !alwaysLog) return; // Prevent logging if verbose is not flagged and alwaysLog is false
    await fs.promises.appendFile(outputFilePath, message + '\n', 'utf8');
}

// Read filter URLs from filters.txt (one URL per line)
async function loadFilterUrls(debug, verbose, logMessage) {
    try {
        await logMessage('Reading filter URLs from filters.txt', verbose);
        const fileContent = await fs.promises.readFile(filtersFilePath, { encoding: 'utf8' });
        FILTER_URLS = fileContent
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line); // Remove empty lines
        await logMessage('Loaded filter URLs: ' + FILTER_URLS.join(', '), debug);
    } catch (err) {
        await logMessage('Error reading filters.txt: ' + err.message, debug);
        console.error(err.stack);
    }
}

// Fetch text content from a URL with retry logic
async function fetchText(url, retries = 3, debug, verbose, logMessage) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await logMessage(`Fetching URL: ${url} (Attempt ${attempt})`, debug);
            const response = await axios.get(url);
            await logMessage(`Fetched data from ${url}`, debug);
            return response.data;
        } catch (error) {
            await logMessage(`Error fetching URL: ${url} (Attempt ${attempt}): ${error.message}`, debug);
            console.error(error.stack);
            if (attempt === retries) {
                await logMessage(`Failed to fetch ${url} after ${retries} attempts`, verbose);
                return '';
            }
            await logMessage(`Retrying fetch for ${url} (Attempt ${attempt + 1})`, verbose);
        }
    }
}

// Convert a line to an AdGuard rule
async function convertToAdGuardRule(line) {
    // Ignore specific localhost and broadcast addresses
    if (
        line === '127.0.0.1 localhost' ||
        line === '127.0.0.1 localhost.localdomain' ||
        line === '127.0.0.1 local' ||
        line === '255.255.255.255 broadcasthost' ||
        line === '::1 localhost' ||
        line === '::1 ip6-localhost' ||
        line === '::1 ip6-loopback' ||
        line === 'fe80::1%lo0 localhost' ||
        line === 'ff00::0 ip6-localnet' ||
        line === 'ff00::0 ip6-mcastprefix' ||
        line === 'ff02::1 ip6-allnodes' ||
        line === 'ff02::2 ip6-allrouters' ||
        line === 'ff02::3 ip6-allhosts' ||
        line === '0.0.0.0 0.0.0.0'
    ) {
        return null;
    }
    // Convert specific IP addresses to AdGuard rules
    if (
        line.startsWith('255.255.255.255') ||
        line.startsWith('::1') ||
        line.startsWith('fe80::1%lo0') ||
        line.startsWith('ff00::0') ||
        line.startsWith('ff00::0') ||
        line.startsWith('ff02::1') ||
        line.startsWith('ff02::2') ||
        line.startsWith('ff02::3')
    ) {
        return null;
    }

    if (line.startsWith('0.0.0.0') || line.startsWith('127.0.0.1')) {
        const parts = line.split(/\s+/);
        if (parts.length > 1) {
            return `||${parts[1]}^$dns-rewrite=ad-block.dns.adguard.com`;
        }
        return line;
    }

    return line;
}

// Update all lists by fetching and processing filter URLs
async function updateAllLists(debug, verbose, logMessage) {
    await logMessage('Starting updateAllLists', verbose);
    await loadFilterUrls(debug, verbose, logMessage);
    if (FILTER_URLS.length === 0) {
        await logMessage('No filter URLs found.', debug);
        return;
    }
    try {
        const results = await Promise.all(FILTER_URLS.map(url => fetchText(url, 3, debug, verbose, logMessage)));
        const adGuardSet = new Set();
        const browserRulesSet = new Set();
        for (let txt of results) {
            const lines = txt.split(/\r?\n/);
            for (let line of lines) {
                const rule = await convertToAdGuardRule(line.trim());
                if (
                    !line.trim() ||
                    line.trim().startsWith('#') ||
                    line.trim().startsWith('!') ||
                    line.trim().startsWith('[') ||
                    line.trim().startsWith('//') ||
                    line.trim().startsWith('<') ||
                    line.trim().startsWith('/*') ||
                    line.trim().startsWith('*/') ||
                    line.trim().startsWith('##') ||
                    line.trim().startsWith('*')
                ) {
                    continue;
                }
                if (rule && rule.startsWith('||')) {
                    line = rule;
                }
                if (line.trim().startsWith('||') || line.trim().startsWith('@@||')) {
                    if (line.trim().startsWith('||') && (line.trim().includes('^$') || line.trim().includes('$') || line.trim().includes('/'))) {
                        adGuardSet.add(line.trim());
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
                                } else {
                                    await logMessage(`Conflict detected: ${line.trim()} conflicts with ${exceptionRule}`, debug);
                                }
                            } else if (line.trim().startsWith('@@||')) {
                                if (!adGuardSet.has(adGuardRule)) {
                                    adGuardSet.add(line.trim());
                                } else {
                                    await logMessage(`Conflict detected: ${line.trim()} conflicts with ${adGuardRule}`, debug);
                                }
                            }
                        }
                    }
                } else {
                    browserRulesSet.add(line.trim());
                }
            }
        }
        await fs.promises.writeFile(mergedFilePath, [...adGuardSet].join('\n'), 'utf8');
        await fs.promises.writeFile(browserRulesFilePath, [...browserRulesSet].join('\n'), 'utf8');
        await logMessage('Combined AdGuard list and browser rules updated successfully.', verbose);
        if (debug) {
            await logMessage('AdGuard rules: ' + [...adGuardSet].join(', '), debug);
            await logMessage('Browser rules: ' + [...browserRulesSet].join(', '), debug);
        }
        const adGuardCount = adGuardSet.size;
        const browserRulesCount = browserRulesSet.size;
        const outputContent = `AdGuard rules count: ${adGuardCount}\nBrowser rules count: ${browserRulesCount}\n`;
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

// Ensure filters.txt and browserRules.txt files exist
async function ensureFiltersFileExists(debug, verbose, logMessage) {
    try {
        await logMessage('Checking if filters.txt exists', debug);
        await fs.promises.access(filtersFilePath);
        await logMessage('filters.txt exists', debug);
    } catch (err) {
        await logMessage(`Error checking filters.txt: ${err.message}`, debug);
        console.error(err.stack);
        if (err.code === 'ENOENT') {
            await logMessage('filters.txt does not exist, creating with default URLs', debug);
            const defaultUrls = [
                'https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/MobileFilter/sections/adservers.txt',
                'https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/AWAvenue-Ads-Rule.txt',
            ];
            try {
                await fs.promises.writeFile(filtersFilePath, defaultUrls.join('\n'), 'utf8');
                await logMessage('Created filters.txt with default URLs', verbose);
            } catch (writeErr) {
                await logMessage(`Error creating filters.txt: ${writeErr.message}`, debug);
                console.error(writeErr.stack);
            }
        } else {
            await logMessage('Error checking filters.txt: ' + err.message, debug);
        }
    }

    try {
        await logMessage('Checking if browserRules.txt exists', debug);
        await fs.promises.access(browserRulesFilePath);
        await logMessage('browserRules.txt exists', verbose);
    } catch (err) {
        await logMessage(`Error checking browserRules.txt: ${err.message}`, debug);
        console.error(err.stack);
        if (err.code === 'ENOENT') {
            await logMessage('browserRules.txt does not exist, creating an empty file', debug);
            try {
                await fs.promises.writeFile(browserRulesFilePath, '', 'utf8');
                await logMessage('Created browserRules.txt', verbose);
            } catch (writeErr) {
                await logMessage(`Error creating browserRules.txt: ${writeErr.message}`, debug);
                console.error(writeErr.stack);
            }
        } else {
            await logMessage('Error checking browserRules.txt: ' + err.message, debug);
        }
    }
}

// Export functions for external use
module.exports = {
    updateAllLists,
    ensureFiltersFileExists,
};
