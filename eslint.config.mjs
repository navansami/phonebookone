import js from '@eslint/js';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'data/**', '.tmp/**', 'seed/**', 'public/sw.js'] },
  js.configs.recommended,
  {
    files: ['app/**/*.{js,jsx}', 'lib/**/*.js', 'scripts/**/*.mjs', 'tests/**/*.mjs'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        Buffer: 'readonly', FormData: 'readonly', File: 'readonly', Request: 'readonly',
        Response: 'readonly', TextDecoder: 'readonly', TextEncoder: 'readonly',
        URL: 'readonly', crypto: 'readonly', console: 'readonly', process: 'readonly',
        fetch: 'readonly',
      },
    },
  },
  { files: ['app/**/*.jsx'], rules: { 'no-unused-vars': 'off' } },
  { files: ['ui/**/*.{js,jsx}'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } }, rules: { 'no-undef': 'off', 'no-unused-vars': 'off' } },
];
