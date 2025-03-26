import { jest } from '@jest/globals';
import { promises as fs } from 'fs';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../src/utils/core/logger.js');
jest.mock('../src/rules/filterUpdate.js');
jest.mock('../src/utils/github/release.js');

// Import after mocks
import { main } from '../src/index.js';
import { updateAllLists, ensureFiltersFileExists } from '../src/rules/filterUpdate.js';
import { updateRelease } from '../src/utils/github/release.js';
import { logMessage } from '../src/utils/core/logger.js';

describe('Main Application', () => {
    const originalArgv = process.argv;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.argv = [...originalArgv];
        process.env = { ...originalEnv };
        
        // Mock successful responses
        updateAllLists.mockResolvedValue({
            total: 10,
            success: 8,
            failed: 2,
            duration: 1.5,
            rules: {
                hosts: 100,
                adguard: 200,
                browser: 50
            }
        });
        ensureFiltersFileExists.mockResolvedValue(undefined);
        updateRelease.mockResolvedValue(true);
    });

    afterAll(() => {
        process.argv = originalArgv;
        process.env = originalEnv;
    });

    describe('Command Line Arguments', () => {
        test('handles --debug flag', async () => {
            process.argv.push('--debug');
            await main();
            expect(logMessage).toHaveBeenCalledWith(
                expect.any(String),
                'DEBUG'
            );
        });

        test('handles --verbose flag', async () => {
            process.argv.push('--verbose');
            await main();
            expect(logMessage).toHaveBeenCalledWith(
                expect.any(String),
                'INFO',
                expect.any(String),
                true
            );
        });

        test('handles --server flag', async () => {
            process.argv.push('--server');
            await main();
            // Verify server initialization
            expect(logMessage).toHaveBeenCalledWith(
                'Starting server mode',
                'INFO'
            );
        });
    });

    describe('Filter Updates', () => {
        test('updates filters successfully', async () => {
            await main();
            expect(ensureFiltersFileExists).toHaveBeenCalled();
            expect(updateAllLists).toHaveBeenCalledWith(false, false);
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('Starting BlockingMachine'),
                'INFO'
            );
        });

        test('handles filter update errors', async () => {
            updateAllLists.mockRejectedValue(new Error('Update failed'));
            await main();
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('failed'),
                'ERROR'
            );
        });
    });

    describe('GitHub Release', () => {
        test('creates release when filters update', async () => {
            process.env.GITHUB_TOKEN = 'test-token';
            await main();
            expect(updateRelease).toHaveBeenCalled();
        });

        test('skips release without token', async () => {
            delete process.env.GITHUB_TOKEN;
            await main();
            expect(updateRelease).not.toHaveBeenCalled();
        });

        test('handles release errors', async () => {
            process.env.GITHUB_TOKEN = 'test-token';
            updateRelease.mockRejectedValue(new Error('Release failed'));
            await main();
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('release failed'),
                'ERROR'
            );
        });
    });

    describe('Error Handling', () => {
        test('handles initialization errors', async () => {
            fs.access.mockRejectedValue(new Error('Access denied'));
            await main();
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('initialization failed'),
                'ERROR'
            );
        });

        test('handles unexpected errors', async () => {
            const error = new Error('Unexpected error');
            updateAllLists.mockImplementation(() => {
                throw error;
            });
            
            await main();
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('Fatal error'),
                'ERROR'
            );
            expect(process.exitCode).toBe(1);
        });
    });

    test('runs successfully with default options', async () => {
        await main();
        
        expect(ensureFiltersFileExists).toHaveBeenCalled();
        expect(updateAllLists).toHaveBeenCalledWith(false, false);
        expect(logMessage).toHaveBeenCalledWith(
            expect.stringContaining('Starting BlockingMachine'),
            'INFO'
        );
    });

    test('handles debug mode', async () => {
        await main({ debug: true });
        
        expect(updateAllLists).toHaveBeenCalledWith(true, false);
        expect(logMessage).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringMatching(/INFO|DEBUG/)
        );
    });

    test('handles verbose mode', async () => {
        await main({ verbose: true });
        
        expect(updateAllLists).toHaveBeenCalledWith(false, true);
    });

    test('handles errors gracefully', async () => {
        const error = new Error('Test error');
        updateAllLists.mockRejectedValue(error);

        await main();

        expect(logMessage).toHaveBeenCalledWith(
            `Fatal error: ${error.message}`,
            'ERROR'
        );
        expect(process.exitCode).toBe(1);
    });
});