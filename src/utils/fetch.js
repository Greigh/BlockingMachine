// Import required modules
import axios from 'axios';
import { logMessage } from './log.js';

/**
 * Fetches text content from a URL with retry logic.
 * 
 * @param {string} url - The URL to fetch the text content from.
 * @param {number} [retries=3] - The number of retry attempts in case of failure.
 * @param {boolean} debug - Flag to enable debug logging.
 * @param {boolean} verbose - Flag to enable verbose logging.
 * @returns {Promise<string>} - The fetched text content, or an empty string if all attempts fail.
 */
export async function fetchText(url, retries = 3, debug, verbose) {
    // Attempt to fetch the URL up to the specified number of retries
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Log the attempt to fetch the URL
            await logMessage(`Fetching URL: ${url} (Attempt ${attempt})`, verbose);
            // Perform the HTTP GET request using axios
            const response = await axios.get(url);
            // Log the successful fetch
            await logMessage(`Fetched data from ${url}`, verbose);
            // Return the fetched data
            return response.data;
        } catch (error) {
            // Log the error encountered during the fetch attempt
            await logMessage(`Error fetching URL: ${url} (Attempt ${attempt}): ${error.message}`, debug);
            // If the last attempt fails, log the failure and return an empty string
            if (attempt === retries) {
                await logMessage(`Failed to fetch ${url} after ${retries} attempts`, verbose);
                return '';
            }
            // Log the retry attempt
            await logMessage(`Retrying fetch for ${url} (Attempt ${attempt + 1})`, verbose);
        }
    }
}