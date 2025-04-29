const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');
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
    // Copy the assets directory into the packaged app
    extraResource: [path.join(__dirname, 'assets')],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
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
