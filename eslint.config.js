const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  // Global ignores
  {
    ignores: ["dist/*", 'eslint.config.js', 'jest.config.mjs', 'coverage/*'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: [
      '{src,test,test-fixture}/**/*.{ts,tsx,cts,mts}',
      'test.ts'
    ],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    }
  },
  {
    files: [
      'test-fixture/**/*.{ts,tsx,cts,mts}',
      'test-fixture/jest.config.js',
      'test.ts'
    ],
    rules: {
      'no-undef': 'off',
      'no-constant-condition': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    }
  },
);
