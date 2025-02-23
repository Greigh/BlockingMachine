const { FlatCompat } = require('@eslint/eslintrc');
const globals = require('globals');
const pluginJs = require('@eslint/js');
const { fileURLToPath } = require('url');
const path = require('path');

// Get the directory name of the current module
const __filename = fileURLToPath(require.main.filename);
const __dirname = path.dirname(__filename);

// Create an instance of FlatCompat
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {
    env: {
      es6: true,
      node: true,
    },
  },
});

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        myCustomGlobal: 'readonly',
      },
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-env'],
        },
      },
    },
    plugins: {
      js: pluginJs,
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
    },
  },
  ...compat.config({
    extends: ['eslint:recommended'],
  }),
];