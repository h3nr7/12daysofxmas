import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const reactHooksRecommended = reactHooks.configs.flat.recommended

// The React Compiler rules in eslint-plugin-react-hooks 7: everything in
// its recommended set apart from rules-of-hooks and exhaustive-deps. All are
// errors, including the two the preset ships as warnings.
const REACT_COMPILER_RULES = Object.keys(reactHooksRecommended.rules).filter(
  (rule) => rule !== 'react-hooks/rules-of-hooks' && rule !== 'react-hooks/exhaustive-deps',
)

export default defineConfig([
  globalIgnores(['dist', 'captures', 'test-results', 'playwright-report']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooksRecommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      ...Object.fromEntries(REACT_COMPILER_RULES.map((rule) => [rule, 'error'])),
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // A leading underscore marks an argument that must stay in the signature but is unused.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Debug mode lives in the URL, and only the wrappers carry it from page
    // to page. A raw Link or useNavigate would quietly drop it (H3N-78).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/hooks/debugNavigation.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'react-router',
          importNames: ['useNavigate', 'Link'],
          message: 'Use useDebugNavigate or DebugLink from src/hooks/debugNavigation.tsx, so ?debug is carried between pages.',
        }],
      }],
    },
  },
  {
    files: ['e2e/**/*.ts', '*.config.{ts,js}'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
