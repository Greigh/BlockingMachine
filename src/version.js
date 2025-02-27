'use strict';

import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Octokit } from '@octokit/rest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const REPO_OWNER = 'greigh';
const REPO_NAME = 'BlockingMachine';
const isInitialRelease = false; // Set this to true only for the first release

async function generateVersion() {
    const now = new Date();
    const major = now.getFullYear() - 2023;
    const minor = now.getMonth() + 1;
    const patch = now.getDate();

    // Check for existing releases today
    try {
        const { data: releases } = await octokit.repos.listReleases({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            per_page: 10
        });

        const todayPattern = new RegExp(`^${major}\\.${minor}\\.${patch}\\s*v?(\\d+)?$`);
        const todayReleases = releases.filter(r => todayPattern.test(r.tag_name));

        const version = `${major}.${minor}.${patch}`;
        if (todayReleases.length > 0) {
            const currentV = todayReleases.length;
            return `${version} v${currentV + 1}`;
        }

        return version;
    } catch (error) {
        console.error('Error checking releases:', error);
        return `${major}.${minor}.${patch}`;
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

async function getRecentCommits() {
    try {
        const { data: commits } = await octokit.repos.listCommits({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            per_page: 5,  // Last 5 commits
            since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
        });

        if (!commits.length) {
            return null;
        }

        return commits
            .map(commit => {
                const msg = commit.commit.message;
                const hash = commit.sha.substring(0, 7);
                return `- ${msg} (${hash})`;
            })
            .filter(msg => !msg.includes('[skip ci]'))
            .join('\n');
    } catch (error) {
        console.error('Error fetching commits:', error);
        return null;
    }
}

async function updateVersion() {
    const version = await generateVersion();
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const time = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Get current rule counts and recent commits
    const adguardCount = await getRuleCount('adguard');
    const browserRulesCount = await getRuleCount('browserRules');
    const hostsCount = await getRuleCount('hosts');
    const recentCommits = await getRecentCommits();

    const releaseNotes = isInitialRelease ? `
# BlockingMachine ${version} (Initial Release)

Released: ${date} at ${time}

## Features
- Unified blocking rules from multiple trusted sources
- Support for multiple filtering methods
- Automatic daily updates with version tracking
- Unique DNS Rewriting technique using a custom light-weight website
  - Dark/Light theme toggle
  - Mobile-responsive interface

## Rule Counts
- AdGuard: ${adguardCount} rules
- Browser: ${browserRulesCount} rules
- Hosts: ${hostsCount} rules`
        : `
# BlockingMachine ${version}

Released: ${date} at ${time}

## Rule Counts
- AdGuard: ${adguardCount} rules
- Browser: ${browserRulesCount} rules
- Hosts: ${hostsCount} rules

## Changes
${recentCommits || '- Updated blocking rules\n- Refreshed rule counts\n- Generated new release'}`;

    try {
        await octokit.repos.createRelease({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            tag_name: version,
            name: `BlockingMachine ${version}`,
            body: releaseNotes,
            draft: false,
            prerelease: false
        });

        // Update README timestamp
        const readmePath = path.join(__dirname, '..', 'README.md');
        let readme = await fs.readFile(readmePath, 'utf8');

        // Add or update the timestamp line
        const timestampLine = `Last Updated: ${date} at ${time}`;
        if (readme.includes('Last Updated:')) {
            readme = readme.replace(/Last Updated:.*$/m, timestampLine);
        } else {
            // Add after the badges section
            const badgesEnd = '<!-- markdownlint-restore -->';
            const insertPosition = readme.indexOf(badgesEnd) + badgesEnd.length;
            readme = readme.slice(0, insertPosition) +
                `\n\n${timestampLine}\n` +
                readme.slice(insertPosition);
        }

        // Update third party filters
        readme = await updateThirdPartyFilters(readme);

        await fs.writeFile(readmePath, readme);

        return version;
    } catch (error) {
        console.error('Error creating release:', error);
        throw error;
    }
}

// Helper function to get rule counts
async function getRuleCount(type) {
    try {
        const filePath = path.join(__dirname, '..', `${type}.txt`);
        const content = await fs.readFile(filePath, 'utf8');
        return content.split('\n').filter(line =>
            line.trim() &&
            !line.startsWith('#') &&
            !line.startsWith('!')
        ).length;
    } catch (error) {
        console.error(`Error getting ${type} rule count:`, error);
        return 0;
    }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
    updateVersion()
        .then(version => console.log(`Created release ${version}`))
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

export { generateVersion, updateVersion };