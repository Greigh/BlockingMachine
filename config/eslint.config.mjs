import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import pluginJs from '@eslint/js';
import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'eslint-define-config';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
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

export default defineConfig({
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
    '@typescript-eslint': {},
  },
  rules: {
    'no-unused-vars': 'error',
    'no-undef': 'error',
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
});