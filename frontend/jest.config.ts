import { defineConfig } from 'jest';
import type { Options as SwcOptions } from '@swc/core';

export default defineConfig({
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
  testEnvironment: 'jsdom',
  transform: {
    'get-local-plugins\\.js$': './scripts/jest-transform-local-plugins.js',
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
        module: {
          type: 'commonjs',
          noInterop: true,
        },
      // prettier too old to support satisfies operator
      // eslint-disable-next-line prettier/prettier
      } satisfies SwcOptions,
    ],
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@patternfly(-\\S+)?|d3(-\\S+)?|delaunator|robust-predicates|internmap|lodash-es|istextorbinary|@console|@novnc|@spice-project|@popperjs|i18next(-\\S+)?|@babel/runtime|jsonpath-plus|nanoid|@rjsf|git-url-parse|git-up|parse-url|protocols|sanitize-html|fuzzysearch|decode-uri-component)/.*)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/public/dist',
    '<rootDir>/.*/integration-tests',
    '<rootDir>/e2e',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/public/dist',
    '<rootDir>/.*/integration-tests',
    '<rootDir>/e2e',
  ],
  testRegex: '.*\\.spec\\.(ts|tsx|js|jsx)$',
  testEnvironmentOptions: {
    url: 'http://localhost',
    globalsCleanup: 'on',
  },
  setupFiles: [
    './__mocks__/fetch.ts',
    './__mocks__/helmet.ts',
    './__mocks__/localStorage.ts',
    './__mocks__/matchMedia.js',
    './__mocks__/mutationObserver.js',
    './__mocks__/resizeObserver.js',
    './__mocks__/serverFlags.js',
    './__mocks__/textEncoderDecoder.ts',
    './__mocks__/sharedScope.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/setup-tests.js'],
  coverageDirectory: '__coverage__',
  coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
  collectCoverageFrom: [
    'public/*.{js,jsx,ts,tsx}',
    'public/{components,module,ui}/**/*.{js,jsx,ts,tsx}',
    'packages/*/src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
});
