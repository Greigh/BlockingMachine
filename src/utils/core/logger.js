import { promises as fs } from 'fs';
import { resolve } from 'path';

/**
 * @typedef {Object} LogConfig
 * @property {number} maxRuns - Maximum number of run logs to keep
 * @property {string} directory - Base directory for logs
 */

const DEFAULT_CONFIG = {
  maxRuns: 5,
  directory: resolve(process.cwd(), 'logs'),
};

class LogManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.runTimestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19); // YYYY-MM-DD-HH-mm-ss
    this.logFiles = {};
  }

  /**
   * Gets log file path for specific level
   * @param {string} level - Log level
   * @returns {string} Log file path
   */
  getLogPath(level) {
    if (!this.logFiles[level]) {
      this.logFiles[level] = resolve(
        this.config.directory,
        level.toLowerCase(),
        `${level}_${this.runTimestamp}.log`
      );
    }
    return this.logFiles[level];
  }

  /**
   * Ensures log directories exist
   */
  async ensureLogDirectories() {
    const levels = Object.values(LogLevel);
    await Promise.all(
      levels.map((level) =>
        fs.mkdir(resolve(this.config.directory, level.toLowerCase()), {
          recursive: true,
        })
      )
    );
  }

  /**
   * Cleans up old log files
   */
  async cleanupOldLogs() {
    const levels = Object.values(LogLevel);

    for (const level of levels) {
      const dir = resolve(this.config.directory, level.toLowerCase());

      try {
        const files = await fs.readdir(dir);
        const logFiles = files
          .filter((f) => f.startsWith(level))
          .sort()
          .reverse();

        // Keep only the newest maxRuns files
        const filesToDelete = logFiles.slice(this.config.maxRuns);

        for (const file of filesToDelete) {
          const filePath = resolve(dir, file);
          await fs.unlink(filePath);
          await logMessage(`Removed old log: ${file}`, LogLevel.DEBUG);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`Failed to cleanup ${level} logs:`, error);
        }
      }
    }
  }

  /**
   * Writes to log file
   */
  async write(entry, level) {
    try {
      await fs.appendFile(this.getLogPath(level), entry + '\n');
    } catch (error) {
      console.error(`Failed to write to ${level} log:`, error);
    }
  }
}

export const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  VERBOSE: 'VERBOSE',
};

// Create singleton instance
const logManager = new LogManager();

/**
 * Writes a message to logs
 * @param {string} message - Message to log
 * @param {LogLevel} level - Log level
 */
export async function logMessage(message, level = LogLevel.INFO) {
  await logManager.ensureLogDirectories();

  const now = new Date();
  let entry = '';

  switch (level) {
    case LogLevel.ERROR:
    case LogLevel.WARN:
    case LogLevel.DEBUG:
      entry = `[${now.toLocaleString()}] ${level}: ${message}`;
      break;
    case LogLevel.VERBOSE:
      entry = `[${now.toISOString()}] ${level}: ${message}`;
      break;
    default:
      entry = message;
  }

  await logManager.write(entry, level);

  // Console output based on level and flags
  const isDebug = process.argv.includes('--debug');
  const isVerbose = process.argv.includes('--verbose');

  switch (level) {
    case LogLevel.ERROR:
      console.error(entry);
      break;
    case LogLevel.WARN:
      console.warn(entry);
      break;
    case LogLevel.DEBUG:
      if (isDebug) console.log(entry);
      break;
    case LogLevel.VERBOSE:
      if (isVerbose) console.log(entry);
      break;
    default:
      console.log(entry);
  }
}

// Clean up old logs on startup
logManager.cleanupOldLogs().catch(console.error);
