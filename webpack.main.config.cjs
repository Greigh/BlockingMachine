const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: {
    index: './src/index.ts',
    preload: './src/preload.ts'
  },
  target: 'electron-main',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '.webpack/main'),
    library: {
      type: 'commonjs2'
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|\.webpack)/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  node: {
    __dirname: false,
    __filename: false
  }
};