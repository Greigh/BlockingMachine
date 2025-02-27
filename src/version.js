'use strict';

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Octokit } from '@octokit/rest';
import {
    adguardFilePath,
    browserRulesFilePath,
    hostsFilePath
} from './utils/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Repository information
const REPO_OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'greigh';
const REPO_NAME = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'BlockingMachine';

async function createOctokitClient() {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
        throw new Error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    }
    return new Octokit({ auth: token });
}

async function generateVersion() {
    const now = new Date();
    return `v${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
}

async function updateVersion() {
    try {
        const octokit = await createOctokitClient();

        // Get rule counts in parallel
        const [adguardCount, browserCount, hostsCount] = await Promise.all([
            getRuleCount(adguardFilePath),
            getRuleCount(browserRulesFilePath),
            getRuleCount(hostsFilePath)
        ]);

        const version = await generateVersion();
        const now = new Date();

        // Create release body
        const body = `
# BlockingMachine ${version}

Released: ${now.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })} at ${now.toLocaleTimeString('en-US')}

## Rule Counts
- AdGuard: ${adguardCount} rules
- Browser: ${browserCount} rules
- Hosts: ${hostsCount} rules

## Changes
${await getRecentCommits(octokit)}
`;

        // First create the tag
        const ref = `refs/tags/${version}`;
        const { data: latestCommit } = await octokit.repos.getCommit({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            ref: 'main'
        });

        await octokit.git.createRef({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            ref,
            sha: latestCommit.sha
        });

        // Then create the release
        await octokit.repos.createRelease({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            tag_name: version,
            name: `BlockingMachine ${version}`,
            body,
            draft: false,
            prerelease: false
        });

        console.log(`Successfully created release ${version}`);
        return version;
    } catch (error) {
        console.error('Error creating release:', error);
        throw error;
    }
}

async function updateThirdPartyFilters(readme) {
    try {
        const filtersJsonPath = path.join(__dirname, '..', 'src', 'filters.json');
        const filters = JSON.parse(await fs.readFile(filtersJsonPath, 'utf8'));

        const thirdPartyStart = '<!-- thirdPartyFilters -->';
        const thirdPartyEnd = '<!-- endThirdPartyFilters -->';
        const startIndex = readme.indexOf(thirdPartyStart) + thirdPartyStart.length;
        const endIndex = readme.indexOf(thirdPartyEnd);

        // Generate content from actual filter sources
        const categorizedFilters = filters.reduce((acc, filter) => {
            if (!acc[filter.category]) {
                acc[filter.category] = [];
            }
            acc[filter.category].push(filter);
            return acc;
        }, {});

        let thirdPartyContent = '\n';

        // Add each category and its filters
        for (const [category, filterList] of Object.entries(categorizedFilters)) {
            thirdPartyContent += `### ${category}\n\n`;
            for (const filter of filterList) {
                thirdPartyContent += `- [${filter.name}](${filter.url})\n`;
                if (filter.description) {
                    thirdPartyContent += `  - *${filter.description}*\n`;
                }
            }
            thirdPartyContent += '\n';
        }

        // Replace content between markers
        return readme.slice(0, startIndex) + thirdPartyContent + readme.slice(endIndex);
    } catch (error) {
        console.error('Error updating third party filters:', error);
        throw error;
    }
}

async function getRecentCommits(octokit) {
    const { data: commits } = await octokit.repos.listCommits({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        per_page: 5
    });

    return commits
        .map(commit => `- ${commit.commit.message} (${commit.sha.substring(0, 7)})`)
        .join('\n');
}

// Helper function to get rule counts
async function getRuleCount(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('!');
        }).length;
    } catch (error) {
        console.error(`Error getting rule count from ${filePath}:`, error);
        return 0;
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    updateVersion().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { generateVersion, updateVersion };