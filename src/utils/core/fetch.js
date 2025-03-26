// Import required modules
import axios from 'axios';
import { logMessage, LogLevel } from './logger.js';

/**
 * Fetches content from a URL with retries
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} options.retries - Number of retries
 * @param {boolean} options.debug - Enable debug logging
 * @returns {Promise<string>} Fetched content
 */
export async function fetchContent(url, options = {}) {
  const { retries = 3, debug = false } = options;
  let attempt = 0;

  while (attempt < retries) {
    try {
      await logMessage(
        `Fetching ${url} (attempt ${attempt + 1}/${retries})`,
        debug ? LogLevel.DEBUG : LogLevel.INFO
      );

      const response = await axios.get(url, {
        timeout: 30000,
        validateStatus: (status) => status === 200,
      });

      return response.data;
    } catch (error) {
      attempt++;
      await logMessage(
        `Failed to fetch ${url}: ${error.message}`,
        debug ? LogLevel.DEBUG : LogLevel.ERROR
      );

      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Fetches a filter list from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string|null>} Filter list content
 */
export async function fetchFilterList(url) {
  try {
    await logMessage(`Fetching ${url} (attempt 1/3)`, LogLevel.INFO);
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'BlockingMachine/1.0',
      },
    });

    if (response.status === 200) {
      await logMessage(
        `Successfully fetched filter list from ${url}`,
        LogLevel.INFO
      );
      return response.data;
    }

    throw new Error(`Failed with status ${response.status}`);
  } catch (error) {
    await logMessage(
      `Failed to fetch ${url}: ${error.message}`,
      LogLevel.ERROR
    );
    return null;
  }
}
