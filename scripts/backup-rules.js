import { backupPersonalRules } from '../src/utils/io/writer.js';

async function main() {
  try {
    await backupPersonalRules();
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

main();
