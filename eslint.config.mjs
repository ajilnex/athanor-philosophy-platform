import { dirname } from 'path'
import { fileURLToPath } from 'url'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default [
    // Ignore patterns
    {
        ignores: [
            'node_modules/**',
            '.next/**',
            'out/**',
            'public/**',
            '*.config.js',
            '*.config.mjs',
            'scripts/**/*.js',
            'scripts/**/*.cjs',
        ],
    },
    // TypeScript files
    ...tseslint.configs.recommended,
    // React settings
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': hooksPlugin,
            '@next/next': nextPlugin,
        },
        rules: {
            // React rules
            'react/no-unescaped-entities': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            // React Hooks
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // Next.js rules
            '@next/next/no-html-link-for-pages': 'error',
            '@next/next/no-img-element': 'warn',
            // TypeScript relaxations
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-require-imports': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
]
