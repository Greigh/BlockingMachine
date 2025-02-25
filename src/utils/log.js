/**
 * Logs a message to the console with timestamp
 * @param {string} message - Message to log
 * @param {string} [level='info'] - Log level (info, warn, error)
 */
export const logMessage = (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    const logLevels = {
        info: console.log,
        warn: console.warn,
        error: console.error
    };

    const logFn = logLevels[level] || console.log;
    logFn(`[${timestamp}] ${message}`);
};