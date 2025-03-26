import { jest, beforeEach } from '@jest/globals';

/**
 * Mock log levels
 * @enum {string}
 */
export const LogLevel = {
    INFO: 'INFO',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
    WARN: 'WARN'
};

/**
 * Mock logger function
 * @type {jest.Mock}
 */
export const logMessage = jest.fn().mockImplementation((message, level = LogLevel.INFO) => {
    // Use the level parameter to simulate different logging behaviors
    if (level === LogLevel.ERROR) {
        console.error(message);
    }
    return Promise.resolve(level);
});

/**
 * Reset mock between tests
 */
beforeEach(() => {
    logMessage.mockClear();
});