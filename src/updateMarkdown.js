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
        return content.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('!');
        }).length;
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