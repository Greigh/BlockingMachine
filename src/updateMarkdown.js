'use strict';

// Define __dirname for ES modules
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Import required modules
import fs from 'fs';
import path from 'path';
import { logMessage } from './utils/log.js';
import {
    thirdPartyFiltersFilePath,
    adguardFilePath,
    browserRulesFilePath,
    hostsFilePath
} from './utils/paths.js';

/**
 * Function to count the number of rules in a file.
 * 
 * @param {string} filePath - The path to the file to count rules in.
 * @returns {Promise<number>} - The number of rules in the file.
 */
async function countRules(filePath) {
    try {
        // Read the content of the file
        const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf8' });
        // Split the content by new lines, filter out empty lines and comments, and count the remaining lines
        return fileContent.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#')).length;
    } catch (err) {
        // Log any errors encountered while reading the file
        console.error(`Error reading ${filePath}:`, err);
        return 0;
    }
}

/**
 * Function to read third-party filter URLs from a file.
 * 
 * @returns {Promise<string[]>} - An array of third-party filter URLs.
 */
async function readThirdPartyFilters() {
    try {
        // Read the content of the third-party filters file
        const fileContent = await fs.promises.readFile(thirdPartyFiltersFilePath, { encoding: 'utf8' });
        // Split the content by new lines, trim each line, and filter out empty lines
        return fileContent.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    } catch (err) {
        // Log any errors encountered while reading the file
        console.error(`Error reading ${thirdPartyFiltersFilePath}:`, err);
        return [];
    }
}

/**
 * Function to update the Markdown file with rule counts and third-party filter URLs.
 */
async function updateMarkdown() {
    // Count the number of rules in each file
    const adguardCount = await countRules(adguardFilePath);
    const browserRulesCount = await countRules(browserRulesFilePath);
    const hostsCount = await countRules(hostsFilePath);
    // Read the third-party filter URLs
    const thirdPartyFilters = await readThirdPartyFilters();

    // Define the path to the Markdown file
    const markdownFilePath = path.resolve(__dirname, '../../README.md');
    try {
        // Read the existing content of the Markdown file
        let existingContent = await fs.promises.readFile(markdownFilePath, { encoding: 'utf8' });

        // Replace placeholders with the actual rule counts
        existingContent = existingContent.replace('<!-- adguardCount -->', adguardCount);
        existingContent = existingContent.replace('<!-- browserRulesCount -->', browserRulesCount);
        existingContent = existingContent.replace('<!-- hostsCount -->', hostsCount);

        // Generate the content for third-party filters and replace the placeholder
        const thirdPartyFiltersContent = thirdPartyFilters.map(url => `- [${url}](${url})`).join('\n');
        existingContent = existingContent.replace('<!-- thirdPartyFilters -->', thirdPartyFiltersContent);

        // Write the updated content back to the Markdown file
        await fs.promises.writeFile(markdownFilePath, existingContent, 'utf8');
        // Log the successful update
        await logMessage('Updated README.md with rule counts and credits.', true);
    } catch (err) {
        // Log any errors encountered while writing to the Markdown file
        console.error(`Error writing to ${markdownFilePath}:`, err);
    }
}

// Call the updateMarkdown function to update the Markdown file
updateMarkdown();