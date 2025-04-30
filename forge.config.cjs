const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { WebpackPlugin } = require('@electron-forge/plugin-webpack');
const path = require('path');

// Conditionally import MakerDMG
let MakerDMG;
try {
  MakerDMG = require('@electron-forge/maker-dmg').MakerDMG;
} catch (e) {
  console.warn('DMG maker not available, skipping');
}

// Import the webpack configs
const mainConfig = require('./webpack.main.config.cjs');
const rendererConfig = require('./webpack.renderer.config.cjs');

const makers = [
  new MakerZIP({}, ['darwin']),
  new MakerRpm({}),
  new MakerDeb({}),
  new MakerSquirrel({
    name: 'BlockingMachine',
    authors: 'Daniel Hipskind',
    exe: 'BlockingMachine.exe',
    setupExe: 'BlockingMachine-Setup.exe',
    setupIcon: './assets/icon.ico',
    iconUrl:
      'https://raw.githubusercontent.com/greigh/Blockingmachine/main/assets/icon.ico',
  }),
];

// Add DMG maker only if available
if (MakerDMG) {
  makers.push(
    new MakerDMG({
      format: 'ULFO',
      icon: path.join(__dirname, 'assets', 'Blockingmachine.icns'),
      background: path.join(__dirname, 'assets', 'dmg-background.png'),
    })
  );
}

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.join(
      __dirname,
      'assets',
      process.platform === 'darwin' ? 'Blockingmachine' : 'icon'
    ),
    extraResource: [path.join(__dirname, 'assets')],
    executableName: 'BlockingMachine',
    appBundleId: 'com.danielhipskind.blockingmachine',
  },
  rebuildConfig: {},
  makers: makers,
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
              webSecurity: false, // Only for development
            },
          },
        ],
      },
    }),
  ],
};
