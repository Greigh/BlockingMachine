'use strict';
import { promises as fs } from 'fs';
import { logMessage } from './utils/log.js';
import {
    adguardFilePath,
    browserRulesFilePath,
    hostsFilePath,
    readmePath,
    statsFilePath
} from './utils/paths.js';

async function countRules(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        // Split by newlines and filter out:
        // - Empty lines
        // - Comments starting with ! or #
        // - Header sections
        const rules = content.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed &&
                !trimmed.startsWith('!') &&
                !trimmed.startsWith('#') &&
                !trimmed.startsWith('=') &&
                trimmed !== '' &&
                !trimmed.includes('Title:') &&
                !trimmed.includes('Description:') &&
                !trimmed.includes('Homepage:') &&
                !trimmed.includes('Last modified:') &&
                !trimmed.includes('Number of rules:') &&
                !trimmed.includes('Format:');
        });

        // Debug logging
        console.log(`Counted ${rules.length} rules in ${filePath}`);

        return rules.length;
    } catch (error) {
        console.error(`Error counting rules in ${filePath}:`, error);
        return 0;
    }
}

async function updateStats() {
    try {
        // Get accurate rule counts
        const browserRules = await countRules(browserRulesFilePath);
        const dnsRules = await countRules(adguardFilePath);
        const hostsRules = await countRules(hostsFilePath);
        const totalRules = browserRules + dnsRules + hostsRules;

        // Create stats object
        const stats = {
            lastUpdated: new Date().toISOString(),
            totalRules,
            browserRules,
            dnsRules,
            hostsRules
        };

        // Update stats.json
        await fs.writeFile(
            statsFilePath,
            JSON.stringify(stats, null, 2)
        );
        await logMessage('Stats file updated successfully', true);

        // Update README.md
        const readmeContent = await fs.readFile(readmePath, 'utf8');
        const updatedContent = readmeContent
            .replace(/<!-- adguardCount -->.*/, `<!-- adguardCount -->${dnsRules} rules`)
            .replace(/<!-- browserRulesCount -->.*/, `<!-- browserRulesCount -->${browserRules} rules`)
            .replace(/<!-- hostsCount -->.*/, `<!-- hostsCount -->${hostsRules} rules`)
            .replace(/<!-- totalRules -->.*/, `<!-- totalRules -->${totalRules} rules`);

        await fs.writeFile(readmePath, updatedContent);
        await logMessage('Rule counts updated in README.md', true);
    } catch (error) {
        console.error('Error updating stats:', error);
        process.exit(1);
    }
}

// Call the update function
updateStats().catch(console.error);