import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Lint rules for the app (src/), the e2e tests and the config files.
 * Almost everything in the "readability" block is auto-fixable:
 * run `npm run lint:fix` before committing.
 */
export default tseslint.config(
  {
    ignores: ['dist', 'dist-e2e', 'test-results', 'playwright-report', 'coverage', 'node_modules', 'reference'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---- readability ------------------------------------------------------------
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      // Every if / else / for / while gets braces, and the body goes on its own line.
      curly: ['error', 'all'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1, ignoredNodes: ['TemplateLiteral *'] }],

      // Blank lines that separate the "steps" of a function.
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
        { blankLine: 'always', prev: '*', next: 'multiline-block-like' },
        { blankLine: 'always', prev: 'multiline-block-like', next: '*' },
      ],
      '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],

      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/eol-last': 'error',

      eqeqeq: ['error', 'always', { null: 'ignore' }], // `x == null` is the one allowed loose check
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
    },
  },

  // ---- app ------------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // ---- config files -----------------------------------------------------------
  {
    files: ['*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
)
