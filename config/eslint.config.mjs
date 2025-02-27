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
        ignores: ['node_modules/**', 'dist/**'],
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
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'indent': 'off',
            'no-unused-vars': 'warn',
            'no-console': ['off', { allow: ['error', 'warn', 'info'] }],
            'no-undef': 'error',
            'no-debugger': 'warn'
        }
    },
    ...compat.extends('plugin:@typescript-eslint/recommended'),
];