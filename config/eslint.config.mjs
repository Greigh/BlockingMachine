import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';
import js from '@eslint/js';
import globals from 'globals';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an instance of FlatCompat
const compat = new FlatCompat({
    baseDirectory: __dirname,
});

export default [
    js.configs.recommended,
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.browser,
            },
            parser: await import('@babel/eslint-parser'),
            parserOptions: {
                requireConfigFile: false,
                babelOptions: {
                    presets: ['@babel/preset-env'],
                },
            },
        },
        rules: {
            // Enforce semicolons at the end of statements
            'semi': ['error', 'always'],

            // Enforce single quotes for string literals
            'quotes': ['error', 'single'],

            // Disable indentation checking completely
            'indent': 'off',

            // Warn when variables are declared but not used
            'no-unused-vars': 'warn',

            // Allow console.log and other console methods
            'no-console': 'off',

            // Error when using undefined variables
            'no-undef': 'error',
        },
    },
    ...compat.extends('plugin:@typescript-eslint/recommended'),
];