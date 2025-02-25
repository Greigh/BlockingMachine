'use strict';
import fs from 'fs';
import { logMessage } from './utils/log.js';
import {
    adguardFilePath,
    browserRulesFilePath,
    hostsFilePath,
    readmePath
} from './utils/paths.js';
import { filterRules } from './rules/update.js';

/**
 * Reads and returns the content of README.md
 * @returns {Promise<string>} The README content
 */
async function getReadmeContent() {
    return await fs.promises.readFile(readmePath, { encoding: 'utf8' });
}

/**
 * Function to update the Markdown file with rule counts.
 */
async function updateMarkdown() {
    try {
        const readmeContent = await getReadmeContent();

        // Get filtered counts
        const adguardCount = await filterRules(adguardFilePath, false, true);
        const browserRulesCount = await filterRules(browserRulesFilePath, false, true);
        const hostsCount = await filterRules(hostsFilePath, false, true);

        // Update the counts in README.md
        let updatedContent = readmeContent
            .replace(/<!-- adguardCount -->.*/, `<!-- adguardCount -->${adguardCount} rules`)
            .replace(/<!-- browserRulesCount -->.*/, `<!-- browserRulesCount -->${browserRulesCount} rules`)
            .replace(/<!-- hostsCount -->.*/, `<!-- hostsCount -->${hostsCount} rules`);

        // Write the updated content back to README.md
        await fs.promises.writeFile(readmePath, updatedContent);
        await logMessage('Rule counts updated in README.md', true);
    } catch (error) {
        console.error('Error updating README.md:', error);
    }
}

// Call the updateMarkdown function
updateMarkdown();