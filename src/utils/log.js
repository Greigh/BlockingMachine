// Import required modules
const fs = require('fs');
const { outputFilePath } = require('./paths'); // Import the output file path

/**
 * Helper function to log messages to a file.
 * 
 * @param {string} message - The message to log.
 * @param {boolean} verbose - Flag to enable verbose logging.
 * @param {boolean} [alwaysLog=false] - Flag to always log the message regardless of the verbose flag.
 */
async function logMessage(message, verbose, alwaysLog = false) {
    // If verbose logging is not enabled and alwaysLog is false, do not log the message
    if (!verbose && !alwaysLog) return;
    // Append the message to the output file
    await fs.promises.appendFile(outputFilePath, message + '\n', 'utf8');
}

// Export the logMessage function
module.exports = {
    logMessage
};