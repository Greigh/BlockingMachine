const path = require('path');

module.exports = {
  entry: './src/index.ts',
  target: 'electron-main',
  module: {
    rules: require('./webpack.rules.cjs'),
  },
  plugins: require('./webpack.plugins.cjs'),
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      path: false,
      fs: false,
    },
  },
  externals: {
    electron: 'electron',
  },
  experiments: {
    topLevelAwait: true,
  },
  optimization: {
    minimize: false,
  },
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'index.js',
    chunkFormat: 'module', // Enable ESM format for dynamic imports
  },
};
