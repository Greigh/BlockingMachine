import { logMessage, LogLevel } from '../utils/core/logger.js';
import { convertRules } from './convert.js';
import {
  readFilterUrls,
  fetchFilterList,
} from '../utils/filters/filterUpdate.js';
import { isValidUrl } from '../utils/filters/validator.js';

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
      sourcesProcessed: 0,
      sourcesFailed: 0,
      totalRules: 0,
      adguardRules: 0,
      hostsRules: 0,
      dnsRules: 0,
      browserRules: 0,
    };
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.stats,
    };
  }

  /**
   * Process all filter lists
   */
  async processFilterLists() {
    try {
      const urls = await readFilterUrls();
      if (!urls?.length) {
        await logMessage('No filter URLs found', LogLevel.WARN);
        return null;
      }

      const allRules = [];

      // Collect rules from all sources
      for (const url of urls) {
        try {
          if (!(await isValidUrl(url))) {
            this.stats.sourcesFailed++;
            continue;
          }

          const content = await fetchFilterList(url);
          if (!content) {
            this.stats.sourcesFailed++;
            continue;
          }

          allRules.push(...content.split('\n'));
          this.stats.sourcesProcessed++;
        } catch (error) {
          await logMessage(
            `Failed to process ${url}: ${error.message}`,
            LogLevel.ERROR
          );
          this.stats.sourcesFailed++;
        }
      }

      // Convert all rules at once
      this.stats.totalRules = allRules.length;
      const finalSets = await convertRules(allRules);

      // Update stats
      this.stats.adguardRules = finalSets.adGuardSet.size;
      this.stats.hostsRules = finalSets.hostsSet.size;
      this.stats.dnsRules = finalSets.dnsRewriteSet.size;
      this.stats.browserRules = finalSets.browserRulesSet.size;

      await logMessage(
        `Processed ${this.stats.sourcesProcessed} sources (${this.stats.sourcesFailed} failed)`,
        LogLevel.INFO
      );

      return finalSets;
    } catch (error) {
      await logMessage(
        `Filter processing failed: ${error.message}`,
        LogLevel.ERROR
      );
      throw error;
    }
  }
}
