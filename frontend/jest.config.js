// https://jestjs.io/docs/en/configuration.html
// https://kulshekhar.github.io/ts-jest/user/config/

const { jsWithTs: tsJestPreset } = require('ts-jest/presets');

module.exports = {
  moduleFileExtensions: [
    'js', 'jsx', 'ts', 'tsx'
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js'
  },
  transform: {
    ...tsJestPreset.transform,
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!lodash-es|@console)'
  ],
  testRegex: '/__tests__/.*\\.(ts|tsx|js|jsx)$',
  setupFiles: [
    './__mocks__/requestAnimationFrame.js',
    './__mocks__/localStorage.ts',
    './__mocks__/matchMedia.js',
  ],
  setupFilesAfterEnv: [
    './before-tests.js',
  ],
  snapshotResolver: './snapshotResolver.js',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  coverageDirectory: '__coverage__',
  coverageReporters: [
    'json', 'lcov', 'text', 'text-summary'
  ],
  collectCoverageFrom: [
    'public/*.{js,jsx,ts,tsx}',
    'public/{components,module,ui}/**/*.{js,jsx,ts,tsx}',
    'packages/*/src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**'
  ]
};
