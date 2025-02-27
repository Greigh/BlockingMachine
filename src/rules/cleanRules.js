import { promises as fs } from 'fs';

import { browserRulesFilePath } from './utils/paths.js';

const excludePatterns = [
    /###cookie-modal$/,
    /##\.cookie-modal$/
];

async function cleanRules() {
    try {
        // Read browserRules.txt
        const content = await fs.readFile(browserRulesFilePath, 'utf8');

        // Split into lines
        const lines = content.split('\n');

        // Filter out lines matching exclude patterns
        const cleanedLines = lines.filter(line => {
            return !excludePatterns.some(pattern => pattern.test(line));
        });

        // Write back to file
        await fs.writeFile(browserRulesFilePath, cleanedLines.join('\n'));

        console.log('Successfully cleaned rules');
    } catch (error) {
        console.error('Error cleaning rules:', error);
    }
}

// Run the function
cleanRules();