'use strict';

const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const REPO_OWNER = 'greigh';
const REPO_NAME = 'BlockingMachine';

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

    // Create GitHub release
    try {
        const isInitialRelease = true; // Set this to false after first release
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
- AdGuard: <!-- adguardCount --> rules
- Browser: <!-- browserRulesCount --> rules
- Hosts: <!-- hostsCount --> rules`
            : `
# BlockingMachine ${version}

Released: ${date} at ${time}

## Rule Counts
- AdGuard: <!-- adguardCount --> rules
- Browser: <!-- browserRulesCount --> rules
- Hosts: <!-- hostsCount --> rules

## Changes
- Updated blocking rules
- Refreshed rule counts
- Generated new release`;

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
        let readme = fs.readFileSync(readmePath, 'utf8');

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

        fs.writeFileSync(readmePath, readme);

        return version;
    } catch (error) {
        console.error('Error creating release:', error);
        throw error;
    }
}

// Add to package.json dependencies
const packageJson = {
    "dependencies": {
        "@octokit/rest": "^19.0.7"
    }
};

module.exports = { generateVersion, updateVersion };

if (require.main === module) {
    updateVersion()
        .then(version => console.log(`Created release ${version}`))
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}