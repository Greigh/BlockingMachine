import { logMessage, LogLevel } from '../core/logger.js';

// Trusted domains for filter sources
const TRUSTED_DOMAINS = new Set([
  'raw.githubusercontent.com',
  'adguardteam.github.io',
  'secure.fanboy.co.nz',
  'github.com',
  'easylist.to',
  'pgl.yoyo.org',
  'hosts-file.net',
]);

const DOMAIN_PATTERN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Extract domain from various rule formats
 * @param {string} rule - Rule to extract domain from
 * @returns {string|null} Extracted domain or null
 */
function getDomain(rule) {
  if (!rule || typeof rule !== 'string') return null;

  try {
    // Hosts format
    if (rule.startsWith('0.0.0.0 ')) {
      return rule.slice(8).trim();
    }

    // AdGuard format
    if (rule.startsWith('||')) {
      return rule.slice(2).split(/[\^$]/)[0] || null;
    }

    return null;
  } catch (error) {
    logMessage(`Error extracting domain: ${error.message}`, LogLevel.DEBUG);
    return null;
  }
}

/**
 * Check if a rule is an allowlist rule
 * @param {string} rule - Rule to check
 * @returns {boolean} - Whether rule is an allowlist rule
 */
function isAllowlistRule(rule) {
  if (!rule || typeof rule !== 'string') {
    return false;
  }
  return rule.startsWith('@@||');
}

/**
 * Check if a rule has important modifier
 * @param {string} rule - Rule to check
 * @returns {boolean} Whether rule has important modifier
 */
function hasImportantModifier(rule) {
  return rule?.includes('$important') || false;
}

/**
 * Checks if a rule is already present in any of the rule sets
 * @param {string} rule - Rule to check for duplicates
 * @param {Object} sets - Object containing sets of rules
 * @param {Set<string>} sets.adGuardSet - AdGuard DNS rules
 * @param {Set<string>} sets.hostsSet - Hosts format rules
 * @param {Set<string>} sets.browserRulesSet - Browser cosmetic rules
 * @param {import('../stats/counter.js').UpdateCounter} counter - Counter for statistics
 * @returns {Promise<boolean>} - True if duplicate found, false otherwise
 */
async function checkForDuplicates(rule, sets, counter) {
  // Don't check duplicates for special rules
  if (isSpecialRule(rule)) {
    return false;
  }

  // Validate parameters
  if (!rule || typeof rule !== 'string') {
    return false;
  }

  if (!sets || typeof sets !== 'object') {
    await logMessage(
      'Invalid sets parameter passed to checkForDuplicates',
      LogLevel.ERROR
    );
    return false;
  }

  // Ensure all required sets exist
  const requiredSets = ['adGuardSet', 'hostsSet', 'browserRulesSet'];
  for (const setName of requiredSets) {
    if (!(sets[setName] instanceof Set)) {
      await logMessage(`Missing required set: ${setName}`, LogLevel.ERROR);
      return false;
    }
  }

  const domain = getDomain(rule);
  if (!domain) {
    return false;
  }

  let isDuplicate = false;

  // Special handling for allowlist rules
  if (isAllowlistRule(rule)) {
    const baseRule = `||${domain}^`;
    const allowRule = `@@||${domain}^`;
    const importantAllowRule = `@@||${domain}^$important`;

    // If this is an important allowlist rule, remove the non-important versions
    if (hasImportantModifier(rule)) {
      if (sets.adGuardSet.has(baseRule)) {
        sets.adGuardSet.delete(baseRule);
        counter.recordDuplicate(
          rule,
          baseRule,
          'allowlist_important',
          'adguard'
        );
        isDuplicate = true;
      }
      if (sets.adGuardSet.has(allowRule)) {
        sets.adGuardSet.delete(allowRule);
        counter.recordDuplicate(
          rule,
          allowRule,
          'allowlist_important',
          'adguard'
        );
        isDuplicate = true;
      }
    }

    // Don't add non-important allowlist if important exists
    if (sets.adGuardSet.has(importantAllowRule)) {
      counter.recordDuplicate(
        importantAllowRule,
        rule,
        'allowlist_important',
        'adguard'
      );
      isDuplicate = true;
    }
  }

  // Check cross-format duplicates if not already marked as duplicate
  if (!isDuplicate) {
    const hostsRule = `0.0.0.0 ${domain}`;
    const adguardRule = `||${domain}^`;
    const dnsRewriteRule = `||${domain}$dnsrewrite=blockingmachine.xyz`;

    if (sets.hostsSet.has(rule)) {
      await logMessage(`Duplicate Hosts rule: ${rule}`, LogLevel.DEBUG);
      counter.stats.rules.duplicates++;
      isDuplicate = true;
    }

    if (sets.adGuardSet.has(rule)) {
      await logMessage(`Duplicate AdGuard rule: ${rule}`, LogLevel.DEBUG);
      counter.stats.rules.duplicates++;
      isDuplicate = true;
    }

    // Allow different formats of the same rule if not duplicate
    if (!isDuplicate && !isAllowlistRule(rule)) {
      if (rule.startsWith('||')) {
        sets.hostsSet.add(hostsRule);
        sets.adGuardSet.add(adguardRule);
        sets.dnsRewriteSet.add(dnsRewriteRule);
      }
    }
  }

  return isDuplicate;
}

/**
 * Validates DNS-style rules
 * @param {string} rule - Rule to validate
 * @returns {boolean} - Whether rule is valid
 */
function isValidDnsRule(rule) {
  try {
    if (!rule || typeof rule !== 'string') return false;

    // Basic DNS rule format
    if (!rule.startsWith('||')) return false;

    // Must have either ^ or $ modifier
    if (!rule.includes('^') && !rule.includes('$')) return false;

    // Domain part validation
    const domain = rule.slice(2).split(/[\^$]/)[0];
    if (!/^[a-z0-9.-]+$/i.test(domain)) return false;

    return true;
  } catch (error) {
    logMessage(`DNS rule validation error: ${error.message}`, LogLevel.ERROR);
    return false;
  }
}

/**
 * Validates DNS rewrite rules
 * @param {string} rule - Rule to validate
 * @returns {boolean} - Whether rule is valid
 */
function isValidDnsRewriteRule(rule) {
  try {
    if (!rule || typeof rule !== 'string') return false;

    // Must be AdGuard syntax with dnsrewrite modifier
    if (!rule.startsWith('||') || !rule.includes('$dnsrewrite=')) return false;

    // Domain part validation
    const domain = getDomain(rule);
    if (!/^[a-z0-9.-]+$/i.test(domain)) return false;

    return true;
  } catch (error) {
    logMessage(
      `DNS rewrite rule validation error: ${error.message}`,
      LogLevel.ERROR
    );
    return false;
  }
}

/**
 * Validates hosts file format rules
 * @param {string} rule - Rule to validate
 * @returns {boolean} - Whether rule is valid
 */
function isValidHostsRule(rule) {
  try {
    if (!rule || typeof rule !== 'string') return false;

    // Basic hosts format validation
    const parts = rule.trim().split(/\s+/);
    if (parts.length !== 2) return false;

    // IP address must be 0.0.0.0 or 127.0.0.1
    if (!['0.0.0.0', '127.0.0.1'].includes(parts[0])) return false;

    // Domain validation
    if (!/^[a-z0-9.-]+$/i.test(parts[1])) return false;

    return true;
  } catch (error) {
    logMessage(`Hosts rule validation error: ${error.message}`, LogLevel.ERROR);
    return false;
  }
}

/**
 * Validates browser-specific rules
 * @param {string} rule - Rule to validate
 * @returns {boolean} - Whether rule is valid
 */
function isValidBrowserRule(rule) {
  try {
    if (!rule || typeof rule !== 'string') return false;

    // Check for common browser rule patterns
    const hasSelector = rule.includes('##');
    const hasException = rule.includes('#@#');
    const hasExtended = rule.includes('#?#');

    if (!hasSelector && !hasException && !hasExtended) return false;

    // Basic syntax validation
    if (hasSelector) {
      const [domain, selector] = rule.split('##');
      if (!selector || (domain && !/^[a-z0-9.-]*$/i.test(domain))) return false;
    }

    return true;
  } catch (error) {
    logMessage(
      `Browser rule validation error: ${error.message}`,
      LogLevel.ERROR
    );
    return false;
  }
}

/**
 * Validates a URL string for filter list sources
 * @param {string} url - URL to validate
 * @param {boolean} [verbose=false] - Enable verbose logging
 * @returns {Promise<boolean>} Whether URL is valid
 */
async function isValidUrlForFilterList(url, verbose = false) {
  try {
    // Basic validation
    if (!url || typeof url !== 'string') {
      await logMessage(`Invalid URL format: ${url}`, LogLevel.DEBUG);
      return false;
    }

    // Protocol validation
    if (!url.startsWith('https://')) {
      await logMessage(`URL must use HTTPS: ${url}`, LogLevel.DEBUG);
      return false;
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Domain validation
    if (
      !TRUSTED_DOMAINS.has(hostname) &&
      ![...TRUSTED_DOMAINS].some((domain) => hostname.endsWith(`.${domain}`))
    ) {
      await logMessage(`Untrusted domain: ${hostname}`, LogLevel.DEBUG);
      return false;
    }

    if (verbose) {
      await logMessage(`Validated filter source: ${url}`, LogLevel.DEBUG);
    }

    return true;
  } catch (error) {
    await logMessage(
      `URL validation error for ${url}: ${error.message}`,
      LogLevel.ERROR
    );
    return false;
  }
}

// Simple duplicate check in a single set
/**
 * Simple duplicate check in a single set
 * @param {string} rule - Rule to check
 * @param {Set<string>} set - Set to check against
 * @returns {boolean} Whether rule is a duplicate
 */
function checkForDuplicatesInSet(rule, set) {
  return set.has(rule);
}

/**
 * Validates a domain name
 * @param {string} domain - Domain to validate
 * @returns {boolean} Whether domain is valid
 */
function isValidDomain(domain) {
  try {
    if (!domain || typeof domain !== 'string') return false;
    domain = domain.trim();
    if (domain.length < 3 || domain.length > 255) return false;
    return DOMAIN_PATTERN.test(domain);
  } catch (error) {
    logMessage(`Domain validation error: ${error.message}`, LogLevel.DEBUG);
    return false;
  }
}

function isSpecialRule(rule) {
  return rule?.match(/(\$important|##+js|^@@|\$third-party)/) !== null;
}

/**
 * Validates a URL string
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
export function isValidUrl(url) {
  try {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Handle domain-only entries
    if (!url.includes('://')) {
      return isValidDomain(url);
    }

    const urlObj = new URL(url);

    // Allow more protocols for filter lists
    const validProtocols = ['http:', 'https:', 'data:', 'chrome:', 'browser:'];
    const isValidProtocol = validProtocols.includes(urlObj.protocol);

    // Domain validation
    const hasValidDomain =
      urlObj.hostname.includes('.') ||
      urlObj.hostname === 'localhost' ||
      urlObj.protocol === 'data:';

    if (!isValidProtocol || !hasValidDomain) {
      logMessage(`Invalid URL format: ${url}`, LogLevel.DEBUG);
      return false;
    }

    return true;
  } catch (error) {
    // Only log actual errors, not validation failures
    if (!(error instanceof TypeError)) {
      logMessage(`URL validation error: ${error.message}`, LogLevel.DEBUG);
    }
    return false;
  }
}

export function isValidRule(rule) {
  // Basic format checks
  if (!rule || typeof rule !== 'string') return false;

  // Allow AdGuard/uBlock syntax
  if (rule.startsWith('||') || rule.startsWith('@@') || rule.includes('#')) {
    return true;
  }

  // Allow hosts format
  if (/^0\.0\.0\.0\s+[a-z0-9.-]+$/i.test(rule)) {
    return true;
  }

  // Allow domain pattern
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(rule)) {
    return true;
  }

  // Allow element hiding rules
  if (/#[@#]|##/.test(rule)) {
    return true;
  }

  return false;
}

// Export all validation functions
export {
  isValidUrlForFilterList,
  isValidDnsRule,
  isValidDnsRewriteRule,
  isValidHostsRule,
  isValidBrowserRule,
  isValidDomain,
  isSpecialRule,
  checkForDuplicates,
  checkForDuplicatesInSet,
};
