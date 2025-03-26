import { jest } from '@jest/globals';
import { logMessage, LogLevel } from '../../src/utils/core/logger.js';

describe('Logger Module', () => {
    // Store original console methods
    const originalConsole = { ...console };
    const mockDate = new Date('2025-02-27T12:00:00Z');

    beforeAll(() => {
        // Mock Date for consistent timestamps
        global.Date = jest.fn(() => mockDate);
        global.Date.now = jest.fn(() => mockDate.getTime());
    });

    beforeEach(() => {
        // Mock console methods
        console.log = jest.fn();
        console.error = jest.fn();
        console.debug = jest.fn();
    });

    afterAll(() => {
        // Restore original console
        global.console = originalConsole;
        global.Date = Date;
    });

    describe('Log Levels', () => {
        test.each([
            ['INFO', 'Test info message', console.log],
            ['ERROR', 'Test error message', console.error],
            ['DEBUG', 'Test debug message', console.debug]
        ])('logs %s level messages correctly', async (level, message, consoleMethod) => {
            await logMessage(message, level);
            
            expect(consoleMethod).toHaveBeenCalledWith(
                expect.stringContaining('[2025-02-27T12:00:00.000Z]'),
                expect.stringContaining(level),
                message
            );
        });

        test('formats timestamp correctly', async () => {
            await logMessage('Test message', LogLevel.INFO);
            expect(console.log).toHaveBeenCalledWith(
                '[2025-02-27T12:00:00.000Z]',
                expect.any(String),
                expect.any(String)
            );
        });
    });

    describe('Error Handling', () => {
        test('handles undefined message', async () => {
            await logMessage(undefined, LogLevel.INFO);
            expect(console.log).toHaveBeenCalledWith(
                expect.any(String),
                'INFO',
                'undefined'
            );
        });

        test('handles invalid log level', async () => {
            await logMessage('Test message', 'INVALID');
            expect(console.log).toHaveBeenCalledWith(
                expect.any(String),
                'INFO',
                'Test message'
            );
        });

        test('handles console method errors', async () => {
            console.log = jest.fn(() => { throw new Error('Console error'); });
            
            // Should not throw
            await expect(logMessage('Test message', LogLevel.INFO))
                .resolves
                .not
                .toThrow();
        });
    });

    describe('Debug Mode', () => {
        test('handles debug flag correctly', async () => {
            // Debug disabled
            await logMessage('Debug message', LogLevel.DEBUG, false);
            expect(console.debug).not.toHaveBeenCalled();

            // Debug enabled
            await logMessage('Debug message', LogLevel.DEBUG, true);
            expect(console.debug).toHaveBeenCalled();
        });

        test('verbose mode includes more details', async () => {
            await logMessage('Verbose message', LogLevel.INFO, false, true);
            expect(console.log).toHaveBeenCalledWith(
                expect.any(String),
                'INFO',
                'Verbose message',
                expect.any(String) // Stack trace or additional info
            );
        });
    });
});