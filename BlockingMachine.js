'use strict';
const axios = require('axios'); // Import axios for making HTTP requests
const path = require('path'); // Import path for handling file paths

let RNFS;

// Define file paths
const filtersFilePath = path.join(RNFS.DocumentDirectoryPath, 'filters.txt');
const mergedFilePath = path.join(RNFS.DocumentDirectoryPath, 'adguard_merged.txt');
const browserRulesFilePath = path.join(RNFS.DocumentDirectoryPath, 'browserRules.txt');
const outputFilePath = path.join(RNFS.DocumentDirectoryPath, 'output.txt');

let FILTER_URLS = [];

// Read filter URLs from filters.txt (one URL per line)
async function loadFilterUrls() {
    try {
        console.log('Reading filter URLs from filters.txt');
        const fileContent = await RNFS.readFile(filtersFilePath, 'utf-8');
        FILTER_URLS = fileContent
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line); // Remove empty lines
        console.log('Loaded filter URLs:', FILTER_URLS);
    } catch (err) {
        if (err instanceof Error) {
            console.error('Error reading filters.txt:', err.message);
        } else {
            console.error('Error reading filters.txt:', err);
        }
    }
}

// Fetch text content from a URL
async function fetchText(url) {
    try {
        console.log(`Fetching URL: ${url}`);
        const response = await axios.get(url);
        console.log(`Fetched data from ${url}`);
        return response.data;
    } catch (error) {
        const err = error;
        console.error(`Failed to fetch ${url}: ${err.message}`);
        return '';
    }
}

// Convert a line to an AdGuard rule
function convertToAdGuardRule(line) {
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
        line.startsWith('127.0.0.1') ||
        line.startsWith('255.255.255.255') ||
        line.startsWith('::1') ||
        line.startsWith('fe80::1%lo0') ||
        line.startsWith('ff00::0') ||
        line.startsWith('ff00::0') ||
        line.startsWith('ff02::1') ||
        line.startsWith('ff02::2') ||
        line.startsWith('ff02::3') ||
        line.startsWith('0.0.0.0')
    ) {
        const parts = line.split(/\s+/);
        if (parts.length > 1) {
            return `||${parts[1]}^`;
        }
        return line;
    }

    if (line.startsWith('0.0.0.0') || line.startsWith('127.0.0.1')) {
        const parts = line.split(/\s+/);
        if (parts.length > 1) {
            return `||${parts[1]}^`;
        }
        return line;
    }

    return line;
}

// Update all lists by fetching and processing filter URLs
async function updateAllLists(debug = false) {
    console.log('Starting updateAllLists');
    await loadFilterUrls();
    if (FILTER_URLS.length === 0) {
        console.error('No filter URLs found.');
        return;
    }
    try {
        const results = await Promise.all(FILTER_URLS.map(fetchText));
        const adGuardSet = new Set();
        const browserRulesSet = new Set();
        results.forEach(txt => {
            txt.split(/\r?\n/).forEach(line => {
                if (
                    !line.trim() ||
                    line.trim().startsWith('#') ||
                    line.trim().startsWith('!')
                ) {
                    return;
                }
                const rule = convertToAdGuardRule(line.trim());
                if (rule) {
                    adGuardSet.add(rule);
                    browserRulesSet.add(rule);
                } else if (line.startsWith('||') || line.startsWith('@@||')) {
                    adGuardSet.add(line.trim());
                    browserRulesSet.delete(line.trim());
                } else if (/^[a-zA-Z]/.test(line)) {
                    browserRulesSet.add(line.trim());
                    adGuardSet.delete(line.trim());
                } else {
                    if (debug) {
                        console.log('Ignoring line:', line);
                    }
                }
            });
        });
        await RNFS.writeFile(mergedFilePath, [...adGuardSet].join('\n'), 'utf8');
        await RNFS.writeFile(browserRulesFilePath, [...browserRulesSet].join('\n'), 'utf8');
        console.log('Combined AdGuard list and browser rules updated successfully.');
        if (debug) {
            console.log('AdGuard rules:', [...adGuardSet]);
            console.log('Browser rules:', [...browserRulesSet]);
        }
        const adGuardCount = adGuardSet.size;
        const browserRulesCount = browserRulesSet.size;
        const outputContent = `AdGuard rules count: ${adGuardCount}\nBrowser rules count: ${browserRulesCount}\n`;
        await RNFS.writeFile(outputFilePath, outputContent, 'utf8');
        console.log('Rule counts written to output.txt');
    } catch (err) {
        const error = err;
        console.error(`Update error: ${error.message}`);
    }
}

// Ensure filters.txt and browserRules.txt files exist
async function ensureFiltersFileExists() {
    try {
        console.log('Checking if filters.txt exists');
        await RNFS.access(filtersFilePath);
        console.log('filters.txt exists');
    } catch {
        console.log('filters.txt does not exist, creating with default URLs');
        const defaultUrls = [
            'https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/MobileFilter/sections/adservers.txt',
            'https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/AWAvenue-Ads-Rule.txt',
        ];
        await RNFS.writeFile(filtersFilePath, defaultUrls.join('\n'), 'utf8');
        console.log('Created filters.txt with default URLs');
    }

    try {
        console.log('Checking if browserRules.txt exists');
        await RNFS.access(browserRulesFilePath);
        console.log('browserRules.txt exists');
    } catch {
        console.log('browserRules.txt does not exist, creating an empty file');
        await RNFS.writeFile(browserRulesFilePath, '', 'utf8');
        console.log('Created browserRules.txt');
    }
}

// Export functions for external use
module.exports = {
    updateAllLists,
    ensureFiltersFileExists,
};

// Ensure filters file exists and update all lists
(async () => {
    const debug = process.argv.includes('-debug');
    console.log('Starting script');
    await ensureFiltersFileExists();
    await updateAllLists(debug);
    console.log('Script finished');
})();
