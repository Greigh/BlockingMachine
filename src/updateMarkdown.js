'use strict';
import fs from 'fs';
import { logMessage } from './utils/log.js';
import {
    adguardFilePath,
    browserRulesFilePath,
    hostsFilePath,
    readmePath,
    statsFilePath  // Add this to paths.js
} from './utils/paths.js';
import { filterRules } from './rules/update.js';
/**
 * Updates both the README.md counts and stats.json file
 */
async function updateStats() {
    try {
        // Get filtered counts
        const adguardCount = await filterRules(adguardFilePath, false, true);
        const browserRulesCount = await filterRules(browserRulesFilePath, false, true);
        const hostsCount = await filterRules(hostsFilePath, false, true);
        const totalRules = adguardCount + browserRulesCount + hostsCount;

        // Create stats object
        const stats = {
            lastUpdated: new Date().toISOString(),
            totalRules,
            browserRules: browserRulesCount,
            dnsRules: adguardCount,
            hostsRules: hostsCount
        };

        // Update stats.json
        await fs.promises.writeFile(
            statsFilePath,
            JSON.stringify(stats, null, 2)
        );
        await logMessage('Stats file updated successfully', true);

        // Update README.md
        const readmeContent = await fs.promises.readFile(readmePath, { encoding: 'utf8' });
        const updatedContent = readmeContent
            .replace(/<!-- adguardCount -->.*/, `<!-- adguardCount -->${adguardCount} rules`)
            .replace(/<!-- browserRulesCount -->.*/, `<!-- browserRulesCount -->${browserRulesCount} rules`)
            .replace(/<!-- hostsCount -->.*/, `<!-- hostsCount -->${hostsCount} rules`);

        await fs.promises.writeFile(readmePath, updatedContent);
        await logMessage('Rule counts updated in README.md', true);
    } catch (error) {
        console.error('Error updating stats:', error);
        process.exit(1);
    }
}

// Call the update function
updateStats();