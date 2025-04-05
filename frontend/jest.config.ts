import { Config } from 'jest';
import { readFileSync } from 'fs';

const tsconfigRaw = readFileSync('./tsconfig.json', 'utf-8');

const config: Config = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'gql', 'graphql'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^dnd-core$': 'dnd-core/dist/cjs',
    '^react-dnd$': 'react-dnd/dist/cjs',
    '^react-dnd-html5-backend$': 'react-dnd-html5-backend/dist/cjs',
    // the developer insists on publishing with their "editions" package, which is poorly supported
    '^binaryextensions$': '<rootDir>/node_modules/binaryextensions/edition-es5',
    '^istextorbinary$': '<rootDir>/node_modules/istextorbinary/edition-es5',
    '^textextensions$': '<rootDir>/node_modules/textextensions/edition-es5',
  },
  testEnvironment: 'jsdom',
  testRunner: 'jest-jasmine2',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['esbuild-jest-transform', { tsconfigRaw }],
    '^.+\\.(gql|graphql)$': './__tests__/utils/transform-graphql-jest-28-shim.js',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@patternfly(-\\S+)?|d3(-\\S+)?|delaunator|robust-predicates|internmap|lodash-es|istextorbinary|@console|@novnc|@spice-project|@popperjs|i18next(-\\S+)?|@babel/runtime)/.*)',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.*/integration-tests-cypress'],
  testRegex: '.*\\.spec\\.(ts|tsx|js|jsx)$',
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  setupFiles: [
    './__mocks__/helmet.ts',
    './__mocks__/localStorage.ts',
    './__mocks__/matchMedia.js',
    './__mocks__/mutationObserver.js',
    './__mocks__/serverFlags.js',
    './__mocks__/websocket.js',
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
  resolver: '<rootDir>/__tests__/utils/jest-resolver.js',
};

export default config;
