module.exports = {
  moduleFileExtensions: ['js', 'ts'],

  testRegex: 'test/.*\\.spec.ts$',

  transform: {
    '^.+\\.(ts|js)x?$': 'ts-jest'
  },

  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: true
    }
  },
  setupFilesAfterEnv: []
};
