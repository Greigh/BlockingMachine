import { logMessage, LogLevel } from '../utils/core/logger.js';
import { isValidDomain } from '../utils/filters/validator.js';

/**
 * Rule category types for initial separation
 * @typedef {Object} SeparatedRules
 * @property {string[]} blocking - Network blocking rules (|| and hosts format)
 * @property {string[]} unblocking - Exception rules (@@|| format)
 * @property {string[]} browser - Cosmetic rules (## format)
 */

/**
 * Final set of processed rules
 * @typedef {Object} FinalRuleSets
 * @property {Set<string>} browserRulesSet - Browser cosmetic rules
 * @property {Set<string>} adGuardSet - AdGuard DNS rules
 * @property {Set<string>} hostsSet - Hosts file format rules
 * @property {Set<string>} dnsRewriteSet - DNS rewrite rules
 */

/**
 * Separates rules into their initial categories based on syntax
 * @param {string[]} rules - Array of raw filter rules
 * @returns {SeparatedRules} Object containing categorized rules
 *
 * @example
 * const rules = ['||example.com^', '##.ad-banner', '@@||trusted.com^'];
 * const separated = separateRules(rules);
 * // Returns: { blocking: ['||example.com^'], unblocking: ['@@||trusted.com^'], browser: ['##.ad-banner'] }
 */
function separateRules(rules) {
  const separated = {
    blocking: [], // || and hosts format rules
    unblocking: [], // @@|| rules
    browser: [], // ## and cosmetic rules
  };

  for (const rule of rules) {
    const trimmed = rule.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('#')) {
      continue;
    }

    // Browser rules first
    if (
      trimmed.includes('##') ||
      trimmed.includes('#@#') ||
      trimmed.includes(':style(') ||
      trimmed.includes(':has(')
    ) {
      separated.browser.push(trimmed);
      continue;
    }

    // Then unblocking rules
    if (trimmed.startsWith('@@||')) {
      separated.unblocking.push(trimmed);
      continue;
    }

    // Finally blocking rules
    if (
      trimmed.startsWith('||') ||
      trimmed.startsWith('0.0.0.0 ') ||
      trimmed.startsWith('127.0.0.1 ')
    ) {
      separated.blocking.push(trimmed);
    }
  }

  return separated;
}

/**
 * Extracts valid domains from filtering rules
 * @param {string[]} rules - Array of filter rules
 * @returns {Set<string>} Set of unique, valid domains
 *
 * @example
 * const rules = ['||ads.example.com^', '0.0.0.0 tracker.com'];
 * const domains = extractDomains(rules);
 * // Returns: Set { 'ads.example.com', 'tracker.com' }
 */
function extractDomains(rules) {
  const domains = new Set();

  for (const rule of rules) {
    let domain;
    if (rule.startsWith('@@||')) {
      domain = rule.slice(4).split('^')[0].split('$')[0];
    } else if (rule.startsWith('||')) {
      domain = rule.slice(2).split('^')[0].split('$')[0];
    } else if (rule.startsWith('0.0.0.0 ') || rule.startsWith('127.0.0.1 ')) {
      domain = rule.split(' ')[1];
    }

    if (domain && isValidDomain(domain)) {
      domains.add(domain);
    }
  }

  return domains;
}

/**
 * Converts raw rules into standardized blocking formats
 * @param {string[]} rules - Array of raw filter rules
 * @returns {Promise<FinalRuleSets>} Object containing processed rule sets
 * @throws {Error} If rule processing fails
 *
 * @example
 * const rules = ['||ads.com^', '##.ad', '@@||safe.com^'];
 * const sets = await convertRules(rules);
 * // Returns: {
 * //   browserRulesSet: Set { '##.ad' },
 * //   adGuardSet: Set { '||ads.com^', '@@||safe.com^' },
 * //   hostsSet: Set { '0.0.0.0 ads.com' },
 * //   dnsRewriteSet: Set { '||ads.com^$dnsrewrite=blockingmachine.xyz', '@@||safe.com^' }
 * // }
 */
export async function convertRules(rules) {
  // First separate into initial categories
  const separated = separateRules(rules);

  // Then extract unique domains
  const blockingDomains = extractDomains(separated.blocking);
  const unblockingDomains = extractDomains(separated.unblocking);

  // Remove unblocked domains from blocking list
  for (const domain of unblockingDomains) {
    blockingDomains.delete(domain);
  }

  // Initialize final sets
  const finalSets = {
    browserRulesSet: new Set(separated.browser),
    adGuardSet: new Set(),
    hostsSet: new Set(),
    dnsRewriteSet: new Set(),
  };

  // Generate final formats for blocking domains
  for (const domain of blockingDomains) {
    finalSets.adGuardSet.add(`||${domain}^`);
    finalSets.hostsSet.add(`0.0.0.0 ${domain}`);
    finalSets.dnsRewriteSet.add(`||${domain}^$dnsrewrite=blockingmachine.xyz`);
  }

  // Add unblocking rules to AdGuard and DNS rewrite sets
  for (const domain of unblockingDomains) {
    const unblockRule = `@@||${domain}^`;
    finalSets.adGuardSet.add(unblockRule);
    finalSets.dnsRewriteSet.add(unblockRule);
  }

  // Log processing results
  await logMessage(
    `Processed ${blockingDomains.size} blocking domains`,
    LogLevel.DEBUG
  );
  await logMessage(
    `Processed ${unblockingDomains.size} unblocking domains`,
    LogLevel.DEBUG
  );
  await logMessage(
    `Processed ${separated.browser.length} browser rules`,
    LogLevel.DEBUG
  );

  return finalSets;
}

/**
 * Available rule types for classification
 * @enum {string}
 */
export const RULE_TYPES = {
  /** Exception rules starting with @@|| */
  ALLOWLIST: 'ALLOWLIST',
  /** Rules in hosts file format */
  HOSTS: 'HOSTS',
  /** AdGuard DNS format rules */
  ADGUARD: 'ADGUARD',
  /** Browser cosmetic rules */
  BROWSER: 'BROWSER',
  /** DNS rewrite rules */
  DNS_REWRITE: 'DNS_REWRITE',
};
