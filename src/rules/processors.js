import { logMessage, LogLevel } from '../utils/core/logger.js';
import { promises as fs } from 'fs';
import { paths } from '../utils/core/paths.js';
import { writeStats } from '../utils/io/writer.js';
import { fetchFilterList } from '../utils/core/fetch.js';
import { isValidRule } from '../utils/filters/validator.js';

export const RuleType = {
  BROWSER: 'browser',
  HOSTS: 'hosts',
  ADGUARD: 'adguard',
  DNS: 'dns',
};

/**
 * Classify a rule into its type
 * @param {string} rule - Rule to classify
 * @returns {string} Rule type
 */
function classifyRule(rule) {
  if (!rule || typeof rule !== 'string') return null;

  if (rule.startsWith('||') || rule.includes('^')) {
    return RuleType.ADGUARD;
  } else if (rule.startsWith('0.0.0.0')) {
    return RuleType.HOSTS;
  } else if (rule.includes('##')) {
    return RuleType.BROWSER;
  } else if (rule.includes('$dnsrewrite')) {
    return RuleType.DNS;
  }

  return null;
}

/**
 * Convert rule to browser format
 * @param {string} rule - Rule to convert
 * @returns {string} Converted rule
 */
function convertToBrowserRule(rule) {
  // Browser-specific conversion logic
  return rule.replace(/^!/, '').trim();
}

/**
 * Convert rule to hosts format
 * @param {string} rule - Rule to convert
 * @returns {string} Converted rule
 */
function convertToHostsRule(rule) {
  // Hosts file format conversion
  return `0.0.0.0 ${rule.replace(/^\|\|/, '').replace(/\^$/, '')}`;
}

/**
 * Convert rule to AdGuard format
 * @param {string} rule - Rule to convert
 * @returns {string} Converted rule
 */
function convertToAdGuardRule(rule) {
  // AdGuard specific conversion
  return rule.startsWith('||') ? rule : `||${rule}`;
}

export {
  classifyRule,
  convertToBrowserRule,
  convertToHostsRule,
  convertToAdGuardRule,
};

export class FilterProcessor {
  constructor(debug = false, verbose = false) {
    this.debug = debug;
    this.verbose = verbose;
    this.stats = {
      timestamp: new Date().toISOString(),
      rules: {
        total: 0,
        browser: 0,
        dns: 0,
        hosts: 0,
        duplicates: 0,
        invalid: 0,
      },
      sources: {
        processed: 0,
        failed: 0,
      },
    };
  }

  async readFilterSets() {
    try {
      // Read personal list
      const personalRules = await fs
        .readFile(paths.input.personalList, 'utf8')
        .then((content) => content.split('\n').filter((line) => line.trim()))
        .catch(() => []);

      // Read third party filters config
      const thirdPartyConfig = await fs
        .readFile(paths.input.thirdPartyFilters, 'utf8')
        .then((content) => content.split('\n').filter((line) => line.trim()))
        .catch(() => []);

      return {
        personal: new Set(personalRules),
        thirdParty: thirdPartyConfig,
      };
    } catch (error) {
      await logMessage(
        `Failed to read filter lists: ${error.message}`,
        LogLevel.ERROR
      );
      throw error;
    }
  }

  async processFilterLists() {
    try {
      const { personal, thirdParty } = await this.readFilterSets();
      const sets = await this.initializeSets(personal);

      // Process third party filters
      for (const url of thirdParty) {
        const content = await fetchFilterList(url);
        if (!content) {
          this.stats.sources.failed++;
          continue;
        }

        const rules = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => {
            // Skip empty lines and comments
            if (!line || line.startsWith('!') || line.startsWith('#')) {
              return false;
            }

            // Validate rule format
            if (!isValidRule(line)) {
              if (this.debug) {
                logMessage(`Invalid rule: ${line}`, LogLevel.DEBUG);
              }
              this.stats.rules.invalid++;
              return false;
            }

            return true;
          });

        await this.processRules(rules, sets);
        this.stats.sources.processed++;
      }

      await this.updateStats(sets);
      return sets;
    } catch (error) {
      await logMessage(
        `Filter processing failed: ${error.message}`,
        LogLevel.ERROR
      );
      throw error;
    }
  }

  async initializeSets(personal) {
    const sets = {
      browser: new Set(personal),
      dns: new Set(),
      hosts: new Set(),
      adGuard: new Set(),
    };

    await logMessage(
      `Found ${sets.browser.size} rules in personal list`,
      LogLevel.INFO
    );

    return sets;
  }

  async processRules(rules, sets) {
    for (const rule of rules) {
      const type = classifyRule(rule);
      if (!type) {
        this.stats.rules.invalid++;
        continue;
      }

      // Track successful rule conversions
      switch (type) {
        case RuleType.BROWSER: {
          const browserRule = convertToBrowserRule(rule);
          if (browserRule) {
            sets.browser.add(browserRule);
            this.stats.rules.browser++;
          }
          break;
        }

        case RuleType.HOSTS: {
          const hostsRule = convertToHostsRule(rule);
          if (hostsRule) {
            sets.hosts.add(hostsRule);
            this.stats.rules.hosts++;
          }
          break;
        }

        case RuleType.ADGUARD: {
          const adGuardRule = convertToAdGuardRule(rule);
          if (adGuardRule) {
            sets.adGuard.add(adGuardRule);
            // Don't increment here as these are counted in total
          }
          break;
        }

        case RuleType.DNS:
          sets.dns.add(rule);
          this.stats.rules.dns++;
          break;
      }
    }
  }

  async updateStats(sets) {
    // Use Set sizes for accurate counts
    this.stats.rules.browser = sets.browser.size;
    this.stats.rules.dns = sets.dns.size;
    this.stats.rules.hosts = sets.hosts.size;

    // Calculate total including all rule types
    this.stats.rules.total =
      sets.browser.size + sets.dns.size + sets.hosts.size;

    // Write stats to file
    await writeStats(this.stats);

    await logMessage(
      `Processed ${this.stats.rules.total} total rules:\n` +
        `- Browser: ${this.stats.rules.browser}\n` +
        `- DNS: ${this.stats.rules.dns}\n` +
        `- Hosts: ${this.stats.rules.hosts}`,
      LogLevel.INFO
    );
  }

  getStats() {
    return this.stats;
  }
}
