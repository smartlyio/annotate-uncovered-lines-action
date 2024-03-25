import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores
  {
    ignores: ["dist/*", 'eslint.config.js', 'jest.config.js']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
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
