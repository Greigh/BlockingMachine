/**
 * GitHub Integration Module
 * 
 * Handles all GitHub API interactions for BlockingMachine.
 * Provides functionality for:
 * - Creating authenticated GitHub clients
 * - Fetching repository commits
 * - Managing repository configuration
 * 
 * @module github/client
 */

import { Octokit } from '@octokit/rest';
import { logMessage, LogLevel } from '../core/logger.js';

/**
 * Repository owner name from environment or default
 * @constant {string}
 * @default 'greigh'
 */
export const REPO_OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'greigh';

/**
 * Repository name from environment or default
 * @constant {string}
 * @default 'BlockingMachine'
 */
export const REPO_NAME = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'BlockingMachine';

/**
 * Creates an authenticated Octokit client for GitHub API interactions
 * 
 * Attempts to use GITHUB_TOKEN first, falls back to GH_TOKEN
 * Throws error if no token is available
 * 
 * @async
 * @throws {Error} If no GitHub token is found in environment variables
 * @returns {Promise<Octokit>} Authenticated Octokit client
 */
export async function createOctokitClient() {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
        await logMessage('GitHub token not found', LogLevel.ERROR);
        throw new Error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    }
    await logMessage('GitHub client created', LogLevel.DEBUG);
    return new Octokit({ auth: token });
}

/**
 * Fetches recent commits from the repository
 * 
 * Retrieves the 5 most recent commits from the specified repository
 * 
 * @async
 * @param {Octokit} octokit - Authenticated Octokit client
 * @returns {Promise<string>} Formatted string of recent commits
 * @throws {Error} If fetching commits fails
 */
export async function getRecentCommits(octokit) {
    try {
        await logMessage(`Fetching recent commits for ${REPO_OWNER}/${REPO_NAME}`, LogLevel.DEBUG);
        const { data: commits } = await octokit.repos.listCommits({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            per_page: 5
        });

        await logMessage(`Found ${commits.length} recent commits`, LogLevel.DEBUG);
        return commits
            .map(commit => `- ${commit.commit.message} (${commit.sha.substring(0, 7)})`)
            .join('\n');
    } catch (error) {
        await logMessage(`Failed to fetch commits: ${error.message}`, LogLevel.ERROR);
        throw error;
    }
}