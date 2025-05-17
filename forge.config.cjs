const path = require('path');

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    name: 'Blockingmachine',
    executableName: 'blockingmachine',
    asar: {
      unpack: "**/node_modules/electron-store/**/*"
    },
    extraResource: [],
    afterPrune: [
      (buildPath, electronVersion, platform, arch, callback) => {
        require('@electron/rebuild').rebuild({
          buildPath,
          electronVersion,
          arch,
          force: true,
          onlyModules: ['electron-store']
        }).then(() => callback()).catch((err) => callback(err));
      }
    ],
    icon: './assets/Blockingmachine',
    platform: 'darwin',
    arch: 'arm64',
    osxSign: {
      identity: 'Developer ID Application: Daniel Hipskind (365KR8NF53)',
      hardenedRuntime: true,
      entitlements: 'build/entitlements.mac.plist',
      'entitlements-inherit': 'build/entitlements.mac.plist',
      'gatekeeper-assess': false
    },
    osxNotarize: process.env.APPLE_ID ? {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    } : undefined
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        name: 'Blockingmachine',
        overwrite: true,
        icon: './assets/Blockingmachine.icns',
        background: './assets/dmg-background.png',
        contents: [
          {
            x: 410,
            y: 150,
            type: 'link',
            path: '/Applications'
          },
          {
            x: 130,
            y: 150,
            type: 'file',
            path: './out/Blockingmachine-darwin-arm64/Blockingmachine.app'
          }
        ]
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.cjs',
        renderer: {
          config: './webpack.renderer.config.cjs',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.tsx',
              name: 'main_window',
              preload: {
                js: './src/preload.ts'
              }
            }
          ],
          port: 3000,
          loggerPort: 9000
        },
        devContentSecurityPolicy: "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:"
      }
    }
  ]
};

module.exports = config;