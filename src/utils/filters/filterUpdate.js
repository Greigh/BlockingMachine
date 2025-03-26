// Import required modules
import { promises as fs } from 'fs';
import path from 'path';
import { logMessage, LogLevel } from '../core/logger.js';
import { fetchContent } from '../core/fetch.js';
import { writeFilterSets } from '../io/writer.js';
import { paths } from '../core/paths.js';
import { FilterProcessor } from '../../rules/processors.js';
import { isValidUrl } from './validator.js';

// Configuration constants
const excludePatterns = [
  /###cookie-modal$/,
  /##\.cookie-modal$/,
  /##\.Cookie/,
  /##\.cookie/,
  /###cookie/,
  /###Cookie/,
];

/**
 * Fetches content from a filter list URL
 * @param {string} url - URL to fetch
 * @param {object} [options] - Fetch options
 * @returns {Promise<string|null>} Filter list content or null if fetch fails
 */
async function fetchFilterList(url, options = {}) {
  try {
    await logMessage(`Fetching filter list: ${url}`, LogLevel.DEBUG);

    const content = await fetchContent(url, {
      retries: 3,
      ...options,
    });

    if (!content) {
      throw new Error('Empty response received');
    }

    await logMessage(
      `Successfully fetched filter list from ${url}`,
      LogLevel.DEBUG
    );
    return content;
  } catch (error) {
    await logMessage(
      `Failed to fetch filter list ${url}: ${error.message}`,
      LogLevel.ERROR
    );
    return null;
  }
}

/**
 * Updates a single filter list
 * @param {string} url - Filter URL to process
 * @param {FilterProcessor} processor - Rule processor instance
 */
async function updateSingleList(url, processor) {
  if (!isValidUrl(url)) {
    await logMessage(`Invalid URL format: ${url}`, LogLevel.ERROR);
    return;
  }

  try {
    const content = await fetchContent(url);
    if (!content) {
      return;
    }

    const lines = content.split('\n');
    for (const line of lines) {
      await processor.processLine(line);
    }

    await processor.counter.recordSuccess('url', url);
  } catch (error) {
    await logMessage(
      `Failed to process ${url}: ${error.message}`,
      LogLevel.ERROR
    );
  }
}

/**
 * Read and combine all filter lists
 */
export async function readFilterUrls() {
  try {
    // Read third-party filter URLs
    const thirdPartyContent = await fs.readFile(paths.input.thirdParty, 'utf8');

    // Read personal filter list directly
    const personalContent = await fs.readFile(paths.input.personal, 'utf8');

    await logMessage('Reading personal filter list...', LogLevel.DEBUG);

    // Return combined unique URLs and direct rules
    const allRules = [
      ...thirdPartyContent.split('\n'),
      ...personalContent.split('\n'),
    ].filter((line) => line && !line.startsWith('//'));

    await logMessage(
      `Found ${allRules.length} total rules including personal list`,
      LogLevel.DEBUG
    );

    return allRules;
  } catch (error) {
    await logMessage(
      `Failed to read filter lists: ${error.message}`,
      LogLevel.ERROR
    );
    throw error;
  }
}

/**
 * Filter and count rules in a file, excluding comments and empty lines
 * @param {string} filePath - The path to the file to process
 * @param {boolean} debug - Enable debug logging
 * @param {boolean} verbose - Enable verbose logging
 * @returns {Promise<number>} - The number of valid rules
 */
async function filterRules(filePath, debug = false, verbose = false) {
  try {
    const fileContent = await fs.readFile(filePath, { encoding: 'utf8' });
    const lines = fileContent.split(/\r?\n/);

    // Preserve metadata and rules
    const validRules = lines.filter((line) => {
      const trimmedLine = line.trim();

      // Keep metadata lines
      if (
        trimmedLine.startsWith('!') &&
        (trimmedLine.includes('Title:') ||
          trimmedLine.includes('Description:') ||
          trimmedLine.includes('Homepage:') ||
          trimmedLine.includes('Last modified:') ||
          trimmedLine.includes('Number of rules:') ||
          trimmedLine.includes('Format:'))
      ) {
        return true;
      }

      // Keep valid rules
      return (
        trimmedLine &&
        !trimmedLine.startsWith('//') &&
        !(trimmedLine.startsWith('#') && !trimmedLine.includes('0.0.0.0')) &&
        !excludePatterns.some((pattern) => pattern.test(trimmedLine))
      );
    });

    await fs.writeFile(filePath, validRules.join('\n') + '\n');
    const ruleCount = validRules.filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed &&
        !trimmed.startsWith('!') &&
        !(trimmed.startsWith('#') && !trimmed.includes('0.0.0.0'))
      );
    }).length;

    await logMessage(
      `Filtered and wrote ${ruleCount} rules to ${filePath}`,
      verbose
    );
    return ruleCount;
  } catch (err) {
    await logMessage(`Error filtering rules: ${err.message}`, debug);
    return 0;
  }
}

/**
 * Main entry point for updating all filter lists
 * @returns {Promise<void>}
 */
async function updateAllLists() {
  const processor = new FilterProcessor();

  try {
    const urls = await readFilterUrls();
    if (!urls.length) {
      await logMessage('No filter URLs found', LogLevel.WARN);
      return;
    }

    await logMessage(`Processing ${urls.length} filter URLs...`, LogLevel.INFO);

    // Process URLs sequentially
    for (const url of urls) {
      await updateSingleList(url, processor);
    }

    // Write processed rules to files with counter
    await writeFilterSets(processor.getProcessedSets(), processor.counter);

    // Print final stats
    if (processor.counter.printDetailedStats) {
      await processor.counter.printDetailedStats();
    }
  } catch (error) {
    await logMessage(`Filter update failed: ${error.message}`, LogLevel.ERROR);
    throw error;
  }
}

/**
 * Ensure filter files exist with default content
 */
async function ensureFiltersFileExists(debug = false, verbose = false) {
  // Check each required file
  const requiredFiles = [
    {
      path: paths.input.thirdParty,
      name: 'thirdPartyFilters.txt',
      defaultContent: [
        'https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/MobileFilter/sections/adservers.txt',
        'https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/AWAvenue-Ads-Rule.txt',
      ].join('\n'),
    },
    {
      path: paths.output.browser,
      name: 'browserRules.txt',
      defaultContent: '',
    },
    {
      path: paths.output.adguard,
      name: 'adguard.txt',
      defaultContent: '',
    },
    {
      path: paths.output.hosts,
      name: 'hosts.txt',
      defaultContent: '',
    },
  ];

  for (const file of requiredFiles) {
    try {
      await logMessage(`Checking if ${file.name} exists`, verbose);
      await fs.access(file.path);
      await logMessage(`${file.name} exists`, verbose);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await logMessage(`${file.name} does not exist, creating file`, debug);
        try {
          await fs.writeFile(file.path, file.defaultContent, 'utf8');
          await logMessage(`Created ${file.name}`, verbose);
        } catch (writeErr) {
          await logMessage(
            `Error creating ${file.name}: ${writeErr.message}`,
            debug
          );
        }
      } else {
        await logMessage(`Error checking ${file.name}: ${err.message}`, debug);
      }
    }
  }
}

// Export all public functions at the bottom
export {
  fetchFilterList,
  filterRules,
  ensureFiltersFileExists,
  updateAllLists,
};
