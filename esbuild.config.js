const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs/promises');

const mainConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: '.build/main.js',
  format: 'esm',
  external: [
    'electron',
    'electron-store',
    'fs-extra',
    '@blockingmachine/core',
    'electron-devtools-installer'
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
};

const rendererConfig = {
  entryPoints: ['src/renderer.tsx'],
  bundle: true,
  platform: 'browser',
  target: 'chrome96',
  outfile: '.build/renderer.js',
  format: 'esm',
  loader: {
    '.css': 'css',
  },
  plugins: [
    {
      name: 'css-loader',
      setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
          const css = await fs.readFile(args.path, 'utf8');
          const contents = `
            const style = document.createElement('style');
            style.textContent = ${JSON.stringify(css)};
            document.head.appendChild(style);
            export default {};
          `;
          return { contents, loader: 'js' };
        });
      },
    },
  ],
  inject: ['./src/css-inject.js'],
};

const preloadConfig = {
  entryPoints: ['src/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: '.build/preload.js',
  format: 'esm',
  external: ['electron'],
};

async function buildApp() {
  try {
    await fs.mkdir('.build', { recursive: true });

    await Promise.all([
      esbuild.build(mainConfig),
      esbuild.build(rendererConfig),
      esbuild.build(preloadConfig),
      fs.copyFile(
        path.join(__dirname, 'src', 'index.html'),
        path.join(__dirname, '.build', 'index.html')
      ),
    ]);

    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

const mainWindow = {
  loadFile: (filePath) => {
    console.log(`Loading file: ${filePath}`);
  },
};

mainWindow.loadFile(path.join(__dirname, 'index.html'));

buildApp();
