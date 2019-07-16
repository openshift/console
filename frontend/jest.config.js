/* eslint-env node */

const transformPackages = require('./package.json').transformPackages;

module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
  transform: {
    '.(ts|tsx|js|jsx)': './node_modules/ts-jest/preprocessor.js',
  },
  transformIgnorePatterns: [
    `<rootDir>/node_modules/(?!${transformPackages.join('|')})`,
  ],
  testRegex: '/__tests__/.*\\.spec\\.(ts|tsx|js|jsx)$',
  testURL: 'http://localhost',
  setupFiles: [
    './__mocks__/localStorage.ts',
    './__mocks__/matchMedia.js',
    './__mocks__/serverFlags.js',
    './before-tests.js',
  ],
  coverageDirectory: '__coverage__',
  coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
  collectCoverageFrom: [
    'public/*.{js,jsx,ts,tsx}',
    'public/{components,module,ui}/**/*.{js,jsx,ts,tsx}',
    'packages/*/src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
};
