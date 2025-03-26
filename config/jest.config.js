import { paths } from '../src/utils/core/paths.js';

export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/**/*.js', '!src/public/**', '!**/node_modules/**'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/'],

  // Add coverage directory from paths
  coverageDirectory: paths.coverage,

  // Add test results output directory
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: paths.test.results,
        outputName: 'junit.xml',
      },
    ],
  ],
};
