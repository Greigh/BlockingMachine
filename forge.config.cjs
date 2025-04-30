const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { MakerDMG } = require('@electron-forge/maker-dmg'); // Add this import
const { WebpackPlugin } = require('@electron-forge/plugin-webpack');
const path = require('path');

// Import the webpack configs
const mainConfig = require('./webpack.main.config.cjs');
const rendererConfig = require('./webpack.renderer.config.cjs');

module.exports = {
  packagerConfig: {
    asar: true,
    // Add these icon configurations
    icon: path.join(
      __dirname,
      'assets',
      process.platform === 'darwin' ? 'Blockingmachine' : 'icon'
    ),
    extraResource: [path.join(__dirname, 'assets')],
    // Ensure product name is valid
    executableName: 'BlockingMachine',
    appBundleId: 'com.danielhipskind.blockingmachine',
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),

    // Keep just this one configured Squirrel maker
    new MakerSquirrel({
      name: 'BlockingMachine',
      authors: 'Daniel Hipskind',
      exe: 'BlockingMachine.exe',
      setupExe: 'BlockingMachine-Setup.exe',
      setupIcon: './assets/icon.ico',
      iconUrl:
        'https://raw.githubusercontent.com/greigh/Blockingmachine/main/assets/icon.ico',
    }),

    // Use the proper constructor format for DMG maker
    new MakerDMG({
      format: 'ULFO',
      icon: path.join(__dirname, 'assets', 'Blockingmachine.icns'),
      background: path.join(__dirname, 'assets', 'dmg-background.png'),
    }),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        configTransformer: require('./webpack.transform.cjs'),
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
            webPreferences: {
              webSecurity: false, // Warning: only for development
            },
          },
        ],
      },
    }),
  ],
};
