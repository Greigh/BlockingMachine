/**
 * Release Management Module
 *
 * Handles GitHub release creation and statistics updates for BlockingMachine.
 * Provides functionality for:
 * - Generating version numbers
 * - Updating statistics in README and stats.json
 * - Creating GitHub releases
 *
 * @module github/release
 */

import { promises as fs } from 'fs';
import { generateStats } from '../stats/counter.js';
import { logMessage, LogLevel } from '../core/logger.js';
import { createOctokitClient, getRecentCommits } from './client.js';
import { paths } from '../core/paths.js';

/**
 * Generates a version string based on the current date
 * Format: vYYYY.MM.DD (e.g., v2025.2.27)
 *
 * @async
 * @returns {Promise<string>} Formatted version string
 *
 * @example
 * const version = await generateVersion();
 * // Returns: "v2025.2.27"
 */
export async function generateVersion() {
  const now = new Date();
  return `v${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
}

/**
 * Updates statistics in both stats.json and README.md
 *
 * Processes current rule counts and updates:
 * - JSON statistics file
 * - README.md placeholders for rule counts
 * - Total rules calculation
 *
 * @async
 * @returns {Promise<Object>} Current statistics
 * @throws {Error} If file operations fail
 *
 * @example
 * const stats = await updateStats();
 * console.log(stats.totalRules);
 */
export async function updateStats() {
  try {
    const stats = await generateStats({
      adguard: paths.output.adguard,
      browser: paths.output.browser,
      hosts: paths.output.hosts,
    });

    // Update stats.json
    await fs.writeFile(paths.output.stats, JSON.stringify(stats, null, 2));
    await logMessage('Stats file updated', LogLevel.INFO);

    // Update README placeholders
    const readmeContent = await fs.readFile(paths.docs.readme, 'utf8');
    const updatedContent = readmeContent
      .replace(
        /<!-- adguardCount -->.*/,
        `<!-- adguardCount -->${stats.adguard} rules`
      )
      .replace(
        /<!-- browserRulesCount -->.*/,
        `<!-- browserRulesCount -->${stats.browser} rules`
      )
      .replace(
        /<!-- hostsCount -->.*/,
        `<!-- hostsCount -->${stats.hosts} rules`
      )
      .replace(
        /<!-- totalRules -->.*/,
        `<!-- totalRules -->${
          stats.adguard + stats.browser + stats.hosts
        } rules`
      );

    await fs.writeFile(paths.docs.readme, updatedContent);
    await logMessage('README updated', LogLevel.INFO);

    return stats;
  } catch (error) {
    await logMessage(
      `Failed to update stats: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}

/**
 * Creates a new GitHub release
 *
 * Generates a release with:
 * - Version-based tag
 * - Recent commit history
 * - Standardized release notes
 *
 * @async
 * @param {string} version - Version string for the release
 * @throws {Error} If release creation fails
 *
 * @example
 * const version = await generateVersion();
 * await createRelease(version);
 */
export async function createRelease(version) {
  try {
    const octokit = await createOctokitClient();
    const recentCommits = await getRecentCommits(octokit);

    const body = `
# BlockingMachine ${version}

## Recent Changes
${recentCommits}
        `;

    await octokit.repos.createRelease({
      owner: process.env.GITHUB_REPOSITORY_OWNER || 'greigh',
      repo: process.env.GITHUB_REPOSITORY?.split('/')[1] || 'BlockingMachine',
      tag_name: version,
      name: `BlockingMachine ${version}`,
      body: body,
      draft: false,
      prerelease: false,
    });
    await logMessage(`Successfully created release ${version}`, LogLevel.INFO);
  } catch (error) {
    await logMessage(
      `Release creation failed: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}
