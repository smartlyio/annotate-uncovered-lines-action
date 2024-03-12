export default {
  moduleFileExtensions: ['js', 'ts'],

  testRegex: 'test/.*\\.spec.ts$',

  transform: {
    '^.+\\.(ts|js)x?$': ['ts-jest', {
      diagnostics: false,
      isolatedModules: false,
    }]
  },
  setupFilesAfterEnv: []
};
