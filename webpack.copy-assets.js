const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = new CopyWebpackPlugin({
  patterns: [
    {
      from: path.resolve(__dirname, 'assets'),
      to: path.resolve(__dirname, '.webpack/main/assets'),
    },
  ],
});
