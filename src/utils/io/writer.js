/**
 * File Writing Module
 *
 * Handles all file writing operations for BlockingMachine filter sets.
 * Provides functionality for:
 * - Writing filter sets to disk with metadata headers
 * - Handling different filter types (AdGuard, Hosts, Browser)
 * - Error handling and logging during file operations
 *
 * @module io/writer
 */

// Import only what we need for writing operations
import { promises as fs } from 'fs';
import { logMessage, LogLevel } from '../core/logger.js';
import { generateMetadata } from '../filters/metadata.js';
import { dirname, join } from 'path';
import { paths } from '../core/paths.js';
import {
  classifyRule,
  convertToBrowserRule,
  convertToHostsRule,
  convertToAdGuardRule,
  RuleType,
} from '../../rules/processors.js';

/**
 * Write filter rules to a file with optional metadata
 * @param {string} filePath - Path to write to
 * @param {Set<string>} rulesSet - Set of rules to write
 * @param {boolean} metadata - Whether to include metadata header
 */
async function writeRulesToFile(filePath, rules, includeMetadata = true) {
  try {
    // Ensure directory exists
    await fs.mkdir(dirname(filePath), { recursive: true });

    // Generate metadata header
    const metadata = includeMetadata
      ? await generateMetadata(filePath, rules.size)
      : '';

    // Convert rules set to array and sort
    const rulesArray = Array.from(rules).sort();

    // Write to file with correct formatting
    const content = [
      metadata.trim(), // Trim metadata
      '', // Single blank line after metadata
      ...rulesArray, // Rules without extra spacing
    ]
      .filter(Boolean) // Remove empty lines
      .join('\n'); // Join with single newlines

    await fs.writeFile(filePath, content + '\n'); // Ensure final newline

    await logMessage(
      `Successfully wrote ${rules.size} rules to ${filePath}`,
      LogLevel.INFO
    );
  } catch (error) {
    await logMessage(
      `Failed to write rules to ${filePath}: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}

/**
 * Read user-defined rules and merge them with downloaded rules
 * @param {Set} existingRules - Set of downloaded rules
 * @param {string} userRulePath - Path to user rules file
 * @returns {Promise<Set>} - Combined set of rules
 */
async function mergeUserRules(existingRules, userRulePath) {
  try {
    // Check if user rules file exists
    const exists = await fs
      .access(userRulePath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      await logMessage(
        `No user rules file found at ${userRulePath}`,
        LogLevel.DEBUG
      );
      return existingRules;
    }

    const userContent = await fs.readFile(userRulePath, 'utf8');
    const userRules = userContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('!') && !line.startsWith('#'));

    if (userRules.length === 0) {
      await logMessage(
        `No valid user rules found in ${userRulePath}`,
        LogLevel.DEBUG
      );
      return existingRules;
    }

    await logMessage(
      `Found ${userRules.length} user-defined rules in ${userRulePath}`,
      LogLevel.DEBUG
    );
    return new Set([...existingRules, ...userRules]);
  } catch (error) {
    await logMessage(
      `Error reading user rules from ${userRulePath}: ${error.message}`,
      LogLevel.ERROR
    );
    return existingRules;
  }
}

/**
 * Process personal rules from a file
 * @param {Object} sets - Rule sets object
 * @param {string} personalRulesPath - Path to personal rules file
 * @param {import('../stats/counter.js').UpdateCounter} counter - Stats counter
 */
async function processPersonalRules(sets, personalRulesPath, counter) {
  try {
    // Check if file exists
    const exists = await fs
      .access(personalRulesPath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      await logMessage('No personal rules file found', LogLevel.DEBUG);
      return;
    }

    // Read and parse personal rules
    const content = await fs.readFile(personalRulesPath, 'utf8');
    const rules = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && !line.startsWith('!'));

    if (!rules.length) {
      await logMessage('No valid personal rules found', LogLevel.DEBUG);
      return;
    }

    await logMessage(
      `Processing ${rules.length} personal rules...`,
      LogLevel.INFO
    );

    // Process each rule
    for (const rule of rules) {
      try {
        // Classify and convert rule
        const ruleType = classifyRule(rule);
        let processedRule = rule;

        // Check for duplicates
        if (await checkForDuplicates(rule, sets, counter)) {
          continue;
        }

        // Process based on rule type
        switch (ruleType) {
          case RuleType.BROWSER:
            processedRule = (await convertToBrowserRule(rule)) || rule;
            if (processedRule.includes('##')) {
              sets.browserRulesSet.add(processedRule);
              counter.stats.rules.valid.browser++;
            }
            break;

          case RuleType.HOSTS:
            processedRule = (await convertToHostsRule(rule)) || rule;
            if (processedRule.startsWith('0.0.0.0 ')) {
              sets.hostsSet.add(processedRule);
              counter.stats.rules.valid.hosts++;
            }
            break;

          case RuleType.ADGUARD:
            if (rule.includes('$dnsrewrite')) {
              sets.adGuardSet.add(rule);
              counter.stats.rules.valid.dnsrewrite++;
            } else {
              processedRule = (await convertToAdGuardRule(rule)) || rule;
              sets.adGuardSet.add(processedRule);
              counter.stats.rules.valid.adguard++;
            }
            break;

          default:
            await logMessage(
              `Skipping invalid personal rule: ${rule}`,
              LogLevel.DEBUG
            );
            counter.stats.rules.invalid++;
        }
      } catch (error) {
        await logMessage(
          `Error processing personal rule: ${error.message}`,
          LogLevel.ERROR
        );
        counter.stats.rules.invalid++;
      }
    }
  } catch (error) {
    await logMessage(
      `Failed to process personal rules: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}

/**
 * Check for duplicate rules across sets
 * @param {string} rule - Rule to check
 * @param {Object} sets - Sets to check against
 * @param {Object} counter - Stats counter
 * @returns {Promise<boolean>} True if duplicate found
 */
async function checkForDuplicates(rule, sets, counter) {
  const normalizedRule = rule.toLowerCase().trim();

  for (const [type, set] of Object.entries(sets)) {
    if (set.has(normalizedRule)) {
      await logMessage(
        `Duplicate rule found in ${type}: ${rule}`,
        LogLevel.DEBUG
      );
      counter.stats.rules.duplicates++;
      return true;
    }
  }
  return false;
}

/**
 * Write processed rules to their respective files
 * @param {Object} sets - Object containing rule sets
 * @param {Set<string>} sets.dnsRewriteSet - DNS rewrite rules
 * @param {Set<string>} sets.hostsSet - Hosts format rules
 * @param {Set<string>} sets.browserRulesSet - Browser cosmetic rules
 * @param {Set<string>} sets.adGuardSet - AdGuard rules
 * @returns {Promise<void>}
 */
async function writeFilterSets(sets) {
  if (!sets || typeof sets !== 'object') {
    throw new Error('Invalid sets parameter');
  }

  try {
    const setMappings = [
      {
        type: 'adguard',
        set: sets.adGuardSet,
        path: paths.output.adguard,
      },
      {
        type: 'dns',
        set: sets.dnsRewriteSet,
        path: paths.output.dnsRewrite,
      },
      {
        type: 'browser',
        set: sets.browserRulesSet,
        path: paths.output.browser,
      },
      {
        type: 'hosts',
        set: sets.hostsSet,
        path: paths.output.hosts,
      },
    ];

    // Write each set
    for (const { type, set, path } of setMappings) {
      if (set?.size > 0) {
        await logMessage(
          `Writing ${set.size} ${type} rules to ${path}`,
          LogLevel.INFO
        );
        await writeRulesToFile(path, set);
      }
    }
  } catch (error) {
    await logMessage(
      `Failed to write filter sets: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}

/**
 * Writes stats to JSON file
 * @param {Object} stats - Statistics object to write
 */
async function writeStats(stats) {
  try {
    const statsJson = JSON.stringify(stats, null, 2);
    await fs.writeFile(paths.output.stats, statsJson);
    await logMessage('Updated stats file', LogLevel.DEBUG);
  } catch (error) {
    await logMessage(`Failed to write stats: ${error.message}`, LogLevel.ERROR);
  }
}

/**
 * Get example rules for each type
 * @param {string} type - Rule type
 * @returns {string} - Example rules
 */
function getExamplesForType(type) {
  const examples = {
    browser: [
      '! Example browser rules:',
      '##.annoying-popup',
      '###cookie-banner',
      'example.com##.ads',
      '~trusted-site.com##.social-buttons',
    ],
    adguard: [
      '! Example AdGuard rules:',
      '||ads.example.com^',
      '@@||trusted-cdn.com^',
      '||tracking.com^$third-party',
    ],
    hosts: [
      '! Example hosts rules:',
      '0.0.0.0 ads.example.com',
      '0.0.0.0 tracking.example.com',
    ],
    dnsrewrite: [
      '! Example DNS rewrite rules:',
      '||ads.example.com^$dnsrewrite=blockingmachine.xyz',
      '||tracker.example.com^$dnsrewrite=blockingmachine.xyz',
    ],
  };
  return examples[type]?.join('\n') || '';
}

/**
 * Creates a backup of personal rules with timestamp
 * @async
 * @returns {Promise<void>}
 */
async function backupPersonalRules() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = paths.userRules.backup;

  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Create backup with timestamp
    const backupPath = join(backupDir, `personal_list_${timestamp}.txt`);
    await fs.copyFile(paths.userRules.personal, backupPath);

    // Keep only last 10 backups
    const backups = await fs.readdir(backupDir);
    if (backups.length > 10) {
      const oldestBackup = backups.sort()[0];
      await fs.unlink(join(backupDir, oldestBackup));
    }

    await logMessage(`Created backup: ${backupPath}`, LogLevel.INFO);
  } catch (error) {
    await logMessage(`Backup failed: ${error.message}`, LogLevel.ERROR);
    throw error;
  }
}

// Export a single object with all functions
export {
  writeRulesToFile,
  mergeUserRules,
  processPersonalRules,
  writeFilterSets,
  writeStats,
  getExamplesForType,
  backupPersonalRules,
  checkForDuplicates, // Add to exports if needed elsewhere
};
