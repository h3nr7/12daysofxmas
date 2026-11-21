import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const reactHooksRecommended = reactHooks.configs.flat.recommended

// The React Compiler rules in eslint-plugin-react-hooks 7: everything in
// its recommended set apart from rules-of-hooks and exhaustive-deps. They
// object to patterns the scenes rely on today (visibility set from the
// route inside an effect, random values made during render, refs read
// during render). They stay warnings while the scene files are rewritten
// in Revival 8 (H3N-71); Revival 9 (H3N-72) sets them back to error.
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
      ...Object.fromEntries(REACT_COMPILER_RULES.map((rule) => [rule, 'warn'])),
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // A leading underscore marks an argument that must stay in the signature but is unused.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['e2e/**/*.ts', '*.config.{ts,js}'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
