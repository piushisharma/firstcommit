module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  ignorePatterns: ['dist/', 'node_modules/', '*.cjs'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/tests/**'],
      env: { jest: true },
    },
  ],
};
