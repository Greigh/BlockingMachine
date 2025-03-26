import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { validateAndEnsureFile } from '../../src/utils/core/paths.js';

jest.mock('fs/promises');
jest.mock('../../src/utils/core/logger.js');

describe('Paths Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('handles EACCES permission error', async () => {
        fs.access.mockRejectedValue(new Error('EACCES: permission denied'));
        
        await expect(validateAndEnsureFile('/test/path'))
            .rejects
            .toThrow('Permission error');
    });

    test('handles ENOSPC disk space error', async () => {
        fs.writeFile.mockRejectedValue(new Error('ENOSPC: no space left on device'));
        
        await expect(validateAndEnsureFile('/test/path'))
            .rejects
            .toThrow('no space left');
    });
});