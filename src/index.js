/**
 * BlockingMachine Entry Point
 *
 * Main entry point for the BlockingMachine filter update process.
 * Handles:
 * - Command line argument processing
 * - Filter list updates
 * - Error handling and logging
 *
 * Run with flags:
 * npm run debug    - Show debug messages
 * npm run verbose  - Show detailed processing
 *
 * @module index
 */
import { promises as fs } from 'fs';
import { logMessage, LogLevel } from './utils/core/logger.js';
import { FilterProcessor } from './rules/processors.js';
import { writeFilterSets, writeStats } from './utils/io/writer.js';
import { paths } from './utils/core/paths.js';

async function validateAndInitialize() {
  try {
    await Promise.all([
      fs.mkdir(paths.input.dir, { recursive: true }),
      fs.mkdir(paths.output.dir, { recursive: true }),
      fs.mkdir(paths.logs, { recursive: true }),
    ]);

    // Validate input files exist but don't create
    await Promise.all([
      fs.access(paths.input.personalList),
      fs.access(paths.input.thirdPartyFilters),
    ]);

    await logMessage('Initialization complete', LogLevel.DEBUG);
  } catch (error) {
    await logMessage(`Initialization failed: ${error.message}`, LogLevel.ERROR);
    throw error;
  }
}

/**
 * Main application entry point
 * @param {Object} options - Command line options
 * @returns {Promise<void>}
 */
export async function main(options = {}) {
  const debug = process.argv.includes('--debug') || options.debug;
  const verbose = process.argv.includes('--verbose') || options.verbose;

  try {
    // Validate inputs and initialize outputs
    await validateAndInitialize();

    const processor = new FilterProcessor(debug, verbose);
    await logMessage('Starting BlockingMachine...', LogLevel.INFO);

    // Process filter lists
    const sets = await processor.processFilterLists();

    // Write final sets
    await writeFilterSets(sets);
    await writeStats(processor.getStats());

    await logMessage(
      'BlockingMachine update completed successfully',
      LogLevel.INFO
    );
  } catch (error) {
    await logMessage(`Update failed: ${error.message}`, LogLevel.ERROR);
    if (debug) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
