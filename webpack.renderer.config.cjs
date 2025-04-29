const rules = require('./webpack.rules.cjs');
const plugins = require('./webpack.plugins.cjs');
const path = require('path');

module.exports = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'], // Make sure .css is included
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    fallback: {
      path: false,
      fs: false,
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  target: 'web',
  devtool: 'source-map',
  optimization: {
    minimize: false,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
      publicPath: '/',
    },
    historyApiFallback: true,
    hot: true,
    port: 9000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      // Ensure proper content type for CSS
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  },
};
