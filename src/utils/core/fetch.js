// Import required modules
import axios from 'axios';
import { logMessage, LogLevel } from './logger.js';

/**
 * Fetches text content from a URL with retry logic and exponential backoff
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} [options.retries=3] - Number of retry attempts
 * @param {number} [options.timeout=30000] - Timeout in milliseconds
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @returns {Promise<string>} Fetched content or empty string on failure
 */
export async function fetchContent(url, options = {}) {
    const {
        retries = 3,
        timeout = 30000,
        debug = false
    } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await logMessage(`Fetching URL: ${url} (Attempt ${attempt}/${retries})`, LogLevel.DEBUG);

            // Add exponential backoff delay for retries
            if (attempt > 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                await logMessage(`Waiting ${delay}ms before retry...`, LogLevel.DEBUG);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            const response = await axios.get(url, {
                timeout,
                headers: {
                    'User-Agent': 'BlockingMachine/1.0 Filter Aggregator',
                    'Accept': 'text/plain, text/html',
                    'Accept-Encoding': 'gzip, deflate, br'
                },
                decompress: true,
                maxContentLength: 50 * 1024 * 1024 // 50MB max
            });

            if (response.status !== 200) {
                throw new Error(`HTTP status ${response.status}: ${response.statusText}`);
            }

            if (!response.data) {
                throw new Error('Empty response received');
            }

            await logMessage(`Successfully fetched ${response.data.length} bytes from ${url}`, LogLevel.DEBUG);
            return response.data;

        } catch (error) {
            const isLastAttempt = attempt === retries;
            const logLevel = isLastAttempt ? LogLevel.ERROR : LogLevel.DEBUG;
            
            await logMessage(
                `Attempt ${attempt}/${retries} failed for ${url}: ${error.message}`,
                logLevel
            );

            if (isLastAttempt) {
                return '';
            }
        }
    }

    return '';
}