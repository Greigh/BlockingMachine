import { logMessage, LogLevel } from '../utils/core/logger.js';
import { isValidDomain } from '../utils/filters/validator.js';

/**
 * Initial categorization of rules into sets
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
 * Extract clean domains from rules
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
 * Convert all rules to final formats
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

export const RULE_TYPES = {
  ALLOWLIST: 'ALLOWLIST',
  HOSTS: 'HOSTS',
  ADGUARD: 'ADGUARD',
  BROWSER: 'BROWSER',
  DNS_REWRITE: 'DNS_REWRITE',
};
