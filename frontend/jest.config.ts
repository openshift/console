import type { Options as SwcOptions } from '@swc/core';
import { defineConfig } from 'jest';

export default defineConfig({
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.ts',
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.ts',
  },
  testEnvironment: 'jsdom',
  transform: {
    'get-local-plugins\\.js$': './scripts/jest-transform-local-plugins.cjs',
    '^.+\\.(ts|tsx|js|mjs)$': [
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
      } satisfies SwcOptions,
    ],
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@patternfly(-\\S+)?|d3(-\\S+)?|delaunator|robust-predicates|internmap|lodash-es|istextorbinary|@console|@novnc|@spice-project|@popperjs|i18next(-\\S+)?|@babel/runtime|jsonpath-plus|nanoid|@rjsf|@x0k|git-url-parse|git-up|parse-url|protocols|sanitize-html|linkify-react|fuzzysearch)/.*)',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/public/dist', '<rootDir>/e2e'],
  modulePathIgnorePatterns: ['<rootDir>/public/dist', '<rootDir>/e2e'],
  testRegex: '.*\\.spec\\.(ts|tsx)$',
  testEnvironmentOptions: {
    url: 'http://localhost',
    globalsCleanup: 'on',
  },
  setupFiles: [
    './__mocks__/fetch.ts',
    './__mocks__/helmet.ts',
    './__mocks__/localStorage.ts',
    './__mocks__/matchMedia.ts',
    './__mocks__/mutationObserver.ts',
    './__mocks__/resizeObserver.ts',
    './__mocks__/serverFlags.ts',
    './__mocks__/structuredClone.ts',
    './__mocks__/textEncoderDecoder.ts',
    './__mocks__/sharedScope.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],
  coverageDirectory: '__coverage__',
  coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
  collectCoverageFrom: [
    'public/*.{ts,tsx}',
    'public/{components,module,ui}/**/*.{ts,tsx}',
    'packages/*/src/**/*.{ts,tsx}',
    '!**/node_modules/**',
  ],
});
