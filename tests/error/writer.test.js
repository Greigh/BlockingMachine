import { jest } from '@jest/globals';
import { writeFilterSets } from '../../src/utils/io/writer.js';
import { logMessage } from '../../src/utils/core/logger.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../src/utils/core/logger.js', () => ({
    logMessage: jest.fn(),
    LogLevel: { INFO: 'INFO', ERROR: 'ERROR', DEBUG: 'DEBUG' }
}));

describe('Writer Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('handles missing path configurations', async () => {
        const sets = {
            hostsSet: new Set(['0.0.0.0 example.com'])
        };
        const paths = {};

        await expect(writeFilterSets(sets, paths))
            .rejects
            .toThrow('No path defined for set type: hostsSet');
    });

    test('handles invalid set data', async () => {
        const invalidInputs = [
            null,
            undefined,
            'string',
            123,
            true,
            []
        ];

        for (const invalidSet of invalidInputs) {
            await expect(writeFilterSets(invalidSet, {}))
                .rejects
                .toThrow('Invalid sets parameter');
        }
    });

    test('handles invalid set contents', async () => {
        const sets = {
            hostsSet: 'not a set',
            adGuard: null
        };
        const paths = {
            hostsSet: '/test/path'
        };

        await expect(writeFilterSets(sets, paths))
            .rejects
            .toThrow('Invalid set type for hostsSet');
    });
});