import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excludePatterns = [
    /###cookie-modal$/,
    /##\.cookie-modal$/
];

async function cleanRules() {
    try {
        // Read browserRules.txt
        const filePath = path.resolve(__dirname, '../../browserRules.txt');
        const content = await fs.readFile(filePath, 'utf8');

        // Split into lines
        const lines = content.split('\n');

        // Filter out lines matching exclude patterns
        const cleanedLines = lines.filter(line => {
            return !excludePatterns.some(pattern => pattern.test(line));
        });

        // Write back to file
        await fs.writeFile(filePath, cleanedLines.join('\n'));

        console.log('Successfully cleaned rules');
    } catch (error) {
        console.error('Error cleaning rules:', error);
    }
}

// Run the function
cleanRules();