const { rebuild } = require('@electron/rebuild');
const path = require('path');

async function main() {
  console.log('Rebuilding native modules...');
  try {
    await rebuild({
      buildPath: path.resolve(__dirname, '..'),
      electronVersion: '36.2.1',
      arch: 'arm64',
      force: true,
      onlyModules: ['macos-alias', 'electron-store'],
      useElectronClang: true
    });
    console.log('Rebuild complete!');
  } catch (err) {
    console.error('Rebuild failed:', err);
    process.exit(1);
  }
}

main();