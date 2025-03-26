/**
 * Statistics Counter Module
 *
 * Handles rule counting and statistics generation for BlockingMachine.
 * Provides functionality for:
 * - Counting non-comment lines in filter files
 * - Generating statistics for multiple filter types
 * - Error handling for file operations
 *
 * @module stats/counter
 */

//import { resolve } from 'path';
import { promises as fs } from 'fs';
import { logMessage, LogLevel } from '../core/logger.js';
import { writeStats } from '../io/writer.js';

/**
 * Counts the number of actual rules in a filter file
 * Excludes:
 * - Empty lines
 * - Comments starting with #, !, or //
 * - Whitespace-only lines
 *
 * @async
 * @param {string} filePath - Path to the filter file
 * @returns {Promise<number>} Number of rules found
 * @throws {Error} If file reading fails
 *
 * @example
 * const count = await getRuleCount('./filters/hosts.txt');
 * console.log(`Found ${count} rules`);
 */
export async function getRuleCount(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const count = content.split('\n').filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('!') &&
        !trimmed.startsWith('//')
      );
    }).length;

    await logMessage(`Counted ${count} rules in ${filePath}`, LogLevel.DEBUG);
    return count;
  } catch (error) {
    await logMessage(
      `Error counting rules in ${filePath}: ${error.message}`,
      LogLevel.ERROR
    );
    return 0;
  }
}

/**
 * Generates statistics for multiple filter files
 *
 * Takes an object mapping filter types to file paths and returns
 * an object with the same keys but containing rule counts
 *
 * @async
 * @param {Object.<string, string>} paths - Mapping of filter types to file paths
 * @returns {Promise<Object.<string, number>>} Mapping of filter types to rule counts
 *
 * @example
 * const stats = await generateStats({
 *   adguard: './filters/adguard.txt',
 *   hosts: './filters/hosts.txt'
 * });
 * // Returns: { adguard: 1000, hosts: 500 }
 */
export async function generateStats(paths) {
  await logMessage('Generating filter statistics', LogLevel.INFO);

  try {
    const counts = await Promise.all(
      Object.entries(paths).map(async ([key, path]) => {
        const count = await getRuleCount(path);
        await logMessage(`${key}: ${count} rules`, LogLevel.DEBUG);
        return [key, count];
      })
    );

    const stats = Object.fromEntries(counts);
    await logMessage('Statistics generation complete', LogLevel.INFO);
    return stats;
  } catch (error) {
    await logMessage(
      `Failed to generate statistics: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}

/**
 * Class to track and count updates during filter processing
 */
export class UpdateCounter {
  constructor() {
    this.stats = {
      rules: {
        total: 0,
        valid: {
          hosts: 0,
          adguard: 0,
          browser: 0,
          dnsrewrite: 0,
        },
        invalid: 0,
        duplicates: 0,
        skipped: 0,
      },
      sources: {
        total: 0,
        success: 0,
        failed: 0,
        errors: new Map(),
      },
    };
  }

  /**
   * Records a skipped rule
   */
  recordSkipped() {
    this.stats.rules.skipped++;
  }

  /**
   * Records a duplicate rule
   * @param {string} originalRule - The original rule that was found
   * @param {string} duplicateRule - The duplicate rule that was found
   * @param {string} type - Type of duplicate (hosts, adguard, etc)
   * @param {string} source - Source of the duplicate rule
   */
  recordDuplicate(originalRule, duplicateRule, type, source) {
    this.stats.rules.duplicates++;
    // Log detailed duplicate info at debug level
    logMessage(
      `Duplicate found: ${duplicateRule} matches ${originalRule} (${type} from ${source})`,
      LogLevel.DEBUG
    );
  }

  /**
   * Validates if a string is a valid URL
   * @param {string} url - URL to validate
   * @returns {Promise<boolean>} Whether the URL is valid
   */
  async isValidUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        await logMessage(
          `Invalid URL (empty or wrong type): ${url}`,
          LogLevel.DEBUG
        );
        return false;
      }

      // For URLs with protocol
      if (url.startsWith('http:') || url.startsWith('https:')) {
        const urlObj = new URL(url);
        // Check if it's a valid URL with hostname
        if (urlObj.hostname) {
          await logMessage(`Valid URL: ${url}`, LogLevel.DEBUG);
          return true;
        }
      }

      // For URLs without protocol
      const domainPattern =
        /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
      const isValid = domainPattern.test(url);

      if (isValid) {
        await logMessage(`Valid domain URL: ${url}`, LogLevel.DEBUG);
      } else {
        await logMessage(`Invalid domain format: ${url}`, LogLevel.DEBUG);
      }

      return isValid;
    } catch (error) {
      await logMessage(
        `URL validation error for ${url}: ${error.message}`,
        LogLevel.DEBUG
      );
      return false;
    }
  }

  /**
   * Validates if a filter source URL is valid
   * @param {string} url - Filter list source URL to validate
   * @returns {Promise<boolean>} Whether the URL is valid
   */
  async isValidSourceUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        await logMessage(`Invalid source URL: ${url}`, LogLevel.DEBUG);
        return false;
      }

      // Filter sources must have HTTPS protocol
      if (!url.startsWith('https://')) {
        await logMessage(`Source URL must use HTTPS: ${url}`, LogLevel.DEBUG);
        return false;
      }

      const urlObj = new URL(url);

      // Allowlist specific domains we trust for filter sources
      const trustedDomains = [
        'raw.githubusercontent.com',
        'adguardteam.github.io',
        'secure.fanboy.co.nz',
        'github.com',
      ];

      const hostname = urlObj.hostname.toLowerCase();
      if (
        !trustedDomains.some(
          (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
        )
      ) {
        await logMessage(
          `Untrusted source domain: ${hostname}`,
          LogLevel.DEBUG
        );
        return false;
      }

      // Validate path exists
      if (!urlObj.pathname || urlObj.pathname === '/') {
        await logMessage(`Invalid source URL path: ${url}`, LogLevel.DEBUG);
        return false;
      }

      return true;
    } catch (error) {
      await logMessage(
        `Source URL validation error: ${error.message}`,
        LogLevel.DEBUG
      );
      return false;
    }
  }

  /**
   * Updates rule counts
   * @param {Object} counts Rule counts by type
   */
  updateRuleCounts(counts) {
    this.stats.rules.valid.browser = counts.browser || 0;
    this.stats.rules.valid.hosts = counts.hosts || 0;
    this.stats.rules.valid.adguard = counts.adguard || 0;
    this.stats.rules.valid.dnsrewrite = counts.dnsrewrite || 0;
    this.stats.rules.total = Object.values(counts).reduce(
      (a, b) => a + (b || 0),
      0
    );
  }

  /**
   * Gets the current stats
   * @returns {Object} Current stats
   */
  getStats() {
    // Convert Map to array for JSON serialization
    const stats = { ...this.stats };
    stats.sources.errors = Array.from(this.stats.sources.errors.entries());
    return stats;
  }

  /**
   * Print final statistics
   */
  async printStats() {
    const stats = this.getStats();

    await logMessage('\nFilter Update Statistics:', LogLevel.INFO);
    await logMessage(`Total Rules: ${stats.rules.total}`, LogLevel.INFO);
    await logMessage(
      `- AdGuard Rules: ${stats.rules.valid.adguard}`,
      LogLevel.INFO
    );
    await logMessage(
      `- Hosts Rules: ${stats.rules.valid.hosts}`,
      LogLevel.INFO
    );
    await logMessage(
      `- Browser Rules: ${stats.rules.valid.browser}`,
      LogLevel.INFO
    );
    await logMessage(
      `- DNS Rewrite Rules: ${stats.rules.valid.dnsrewrite}`,
      LogLevel.INFO
    );
    await logMessage(`Skipped Rules: ${stats.rules.skipped}`, LogLevel.INFO);
    await logMessage(
      `Duplicate Rules: ${stats.rules.duplicates}`,
      LogLevel.INFO
    );
    await logMessage(`Invalid Rules: ${stats.rules.invalid}`, LogLevel.INFO);

    if (stats.sources.failed > 0) {
      await logMessage(
        `\nFailed Sources: ${stats.sources.failed}`,
        LogLevel.WARN
      );
      for (const [url, error] of stats.sources.errors) {
        await logMessage(`- ${url}: ${error}`, LogLevel.DEBUG);
      }
    }
  }

  /**
   * Records a successful operation
   * @param {string} type - Type of success ('url', 'rule', 'adguard', 'browser', 'hosts', 'dns_rewrite')
   * @param {string} [details] - Additional details about the success
   */
  async recordSuccess(type, details = '') {
    const logLevel = details ? LogLevel.VERBOSE : LogLevel.DEBUG;

    switch (type) {
      case 'url':
        this.stats.sources.success++;
        await logMessage(`Successfully processed URL: ${details}`, logLevel);
        break;
      case 'rule':
        this.stats.rules.total++;
        await logMessage(`Successfully processed rule: ${details}`, logLevel);
        break;
      case 'adguard':
        this.stats.rules.valid.adguard++;
        await logMessage(`Added AdGuard rule: ${details}`, logLevel);
        break;
      case 'browser':
        this.stats.rules.valid.browser++;
        await logMessage(`Added browser rule: ${details}`, logLevel);
        break;
      case 'hosts':
        this.stats.rules.valid.hosts++;
        await logMessage(`Added hosts rule: ${details}`, logLevel);
        break;
      case 'dns_rewrite':
        this.stats.rules.valid.dnsrewrite++;
        await logMessage(`Added DNS rewrite rule: ${details}`, logLevel);
        break;
      default:
        await logMessage(`Unknown success type: ${type}`, LogLevel.WARN);
    }
  }
}

/**
 * Class for tracking filter processing statistics
 */
export class StatsCounter {
  constructor() {
    this.stats = {
      rules: {
        total: 0,
        duplicates: 0,
        invalid: 0,
        processed: 0,
      },
      sources: {
        total: 0,
        failed: 0,
        succeeded: 0,
      },
      types: {
        browser: 0,
        hosts: 0,
        adguard: 0,
        dns: 0,
      },
    };
  }

  /**
   * Record successful processing of a source
   * @param {string} type - Type of source
   * @param {string} source - Source identifier
   */
  async recordSuccess(type, source) {
    this.stats.sources.succeeded++;
    await logMessage(
      `Successfully processed ${type}: ${source}`,
      LogLevel.DEBUG
    );
  }

  /**
   * Record failed processing of a source
   * @param {string} type - Type of source
   * @param {string} source - Source identifier
   * @param {Error} error - Error that occurred
   */
  async recordFailure(type, source, error) {
    this.stats.sources.failed++;
    await logMessage(
      `Failed to process ${type}: ${source} - ${error.message}`,
      LogLevel.ERROR
    );
  }

  /**
   * Save current stats to file
   */
  async saveStats() {
    await writeStats(this.stats);
  }
}
