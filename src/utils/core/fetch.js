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
