import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { adminStorageState, developerStorageState } from './e2e/setup/login-helper';

dotenv.config({ path: path.resolve(import.meta.dirname, 'e2e', '.env'), quiet: true });

const isCI = !!process.env.OPENSHIFT_CI || !!process.env.CI;
const chrome = { ...devices['Desktop Chrome'], userAgent: 'ConsoleIntegrationTestEnvironment' };
const isDebug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

const hasDeveloper = !!process.env.BRIDGE_HTPASSWD_USERNAME;

// Write artifacts directly to the CI artifact root; local runs fall back to `frontend/test-results`
const artifactDir = process.env.ARTIFACT_DIR ?? path.resolve(import.meta.dirname, 'test-results');

const packages = [
  'smoke',
  'console',
  'dev-console',
  'helm',
  'knative',
  'olm',
  'topology',
  'webterminal',
];

// Packages that also have developer-persona tests
const devPackages = ['smoke', 'dev-console', 'topology', 'webterminal'];

const chromeArgs = [
  '--ignore-certificate-errors',
  '--window-size=1920,1080',
  '--disable-dev-shm-usage',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-client-side-phishing-detection',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-popup-blocking',
  '--disable-sync',
  '--disable-translate',
  '--no-first-run',
];

export default defineConfig({
  testDir: './e2e/tests',
  testMatch: '**/*.spec.ts',
  grepInvert: process.env.PLAYWRIGHT_HYPERSHIFT === 'true' ? /\s@standalone(?:\s|$)/ : undefined,
  outputDir: path.join(artifactDir, 'playwright-test-results'),
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  timeout: 120_000,
  reporter: isCI
    ? [
        ['line'],
        [
          'junit',
          {
            outputFile: path.join(artifactDir, 'playwright-standard-junit.xml'),
            includeRetries: true,
          },
        ],
        ['html', { outputFolder: path.join(artifactDir, 'playwright-report'), open: 'never' }],
        [
          './e2e/reporters/prow-junit-reporter.ts',
          {
            outputFile: path.join(artifactDir, 'junit-playwright.xml'),
          },
        ],
      ]
    : [['list']],

  use: {
    testIdAttribute: 'data-test',
    baseURL,
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: isDebug ? 'on' : 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: chromeArgs,
    },
  },

  workers: process.env.WORKERS ? Number(process.env.WORKERS) || undefined : undefined,

  projects: [
    {
      name: 'cluster-setup',
      testDir: path.resolve(import.meta.dirname, 'e2e', 'setup'),
      testMatch: 'cluster.setup.ts',
      teardown: 'teardown',
    },
    {
      name: 'admin-auth',
      testDir: path.resolve(import.meta.dirname, 'e2e', 'setup'),
      testMatch: 'admin-auth.setup.ts',
      dependencies: ['cluster-setup'],
      use: {
        ...chrome,
        ignoreHTTPSErrors: true,
        launchOptions: {
          args: chromeArgs,
        },
      },
    },
    {
      name: 'developer-auth',
      testDir: path.resolve(import.meta.dirname, 'e2e', 'setup'),
      testMatch: 'developer-auth.setup.ts',
      dependencies: ['cluster-setup'],
      use: {
        ...chrome,
        ignoreHTTPSErrors: true,
        launchOptions: {
          args: chromeArgs,
        },
      },
    },
    {
      name: 'teardown',
      testDir: path.resolve(import.meta.dirname, 'e2e', 'setup'),
      testMatch: 'teardown.setup.ts',
    },

    {
      name: 'knative-setup',
      testDir: path.resolve(import.meta.dirname, 'e2e', 'setup'),
      testMatch: 'knative.setup.ts',
      dependencies: ['cluster-setup'],
    },

    ...packages.map((pkg) => ({
      name: pkg,
      testDir: path.resolve(import.meta.dirname, 'e2e', 'tests', pkg),
      testIgnore: '**/developer/**',
      dependencies: pkg === 'knative' ? ['admin-auth', 'knative-setup'] : ['admin-auth'],
      use: {
        ...chrome,
        storageState: adminStorageState,
      },
    })),
    ...(hasDeveloper
      ? devPackages.map((pkg) => ({
          name: `${pkg}-developer`,
          testDir: path.resolve(import.meta.dirname, 'e2e', 'tests', pkg, 'developer'),
          dependencies: ['developer-auth'],
          use: {
            ...chrome,
            storageState: developerStorageState,
          },
        }))
      : []),
  ],
});
