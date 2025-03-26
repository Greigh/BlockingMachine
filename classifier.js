import { logMessage, LogLevel } from './src/utils/core/logger.js';

/**
 * Rule type definitions
 * @readonly
 * @enum {string}
 */
export const RuleType = {
  HOSTS: 'hosts',
  ADGUARD: 'adguard',
  BROWSER: 'browser',
  IGNORE: 'ignore',
  INVALID: 'invalid',
};

/**
 * Browser-specific modifiers that indicate the rule should stay in browser rules
 * @readonly
 * @type {Set<string>}
 */
const BROWSER_MODIFIERS = new Set([
  'popup',
  'redirect',
  'replace',
  'removeparam',
  'csp',
  'css',
  'stylesheet',
]);

/**
 * Classifies filter rules based on syntax and modifiers
 * @param {string} rule - The filter rule to classify
 * @returns {RuleType} Classification result
 */
export function classifyRule(rule) {
  if (!rule || typeof rule !== 'string') {
    return RuleType.INVALID;
  }

  const trimmed = rule.trim();

  // Cosmetic filtering rules
  if (trimmed.startsWith('##') || trimmed.startsWith('###')) {
    return RuleType.BROWSER;
  }

  // Skip comments and empty lines
  if (!rule || rule.startsWith('!') || rule.startsWith('#')) {
    return RuleType.IGNORE;
  }

  // Check for browser-specific patterns
  if (
    rule.includes('##') || // Element hiding
    rule.includes('#@#') || // Element hiding exception
    rule.includes('#?#') || // Extended CSS
    rule.includes('#$#') || // CSS rules
    rule.includes('$script') // Script rules
  ) {
    return RuleType.BROWSER;
  }

  // Check for modifiers
  if (rule.includes('$')) {
    const modifiers = rule.split('$')[1].split(',');
    for (const modifier of modifiers) {
      if (BROWSER_MODIFIERS.has(modifier.split('=')[0])) {
        return RuleType.BROWSER;
      }
    }
  }

  // Check for hosts format
  if (rule.startsWith('0.0.0.0 ') || rule.startsWith('127.0.0.1 ')) {
    return RuleType.HOSTS;
  }

  // Basic domain blocks and IP addresses go to ADGUARD
  if (
    (rule.startsWith('||') && rule.includes('^')) ||
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(rule)
  ) {
    return RuleType.ADGUARD;
  }

  // Log unclassified rules for review
  logMessage(`Unclassified rule: ${rule}`, LogLevel.DEBUG);
  return RuleType.ADGUARD;
}

// Export only the classification functions
export default {
  classifyRule,
  RuleType,
};
