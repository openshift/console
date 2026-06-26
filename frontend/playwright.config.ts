import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, 'e2e', '.env'), quiet: true });

import { defineConfig, devices } from '@playwright/test';
import { INTEGRATION_TEST_USER_AGENT } from './packages/console-shared/src/constants/common';

const isCI = !!process.env.OPENSHIFT_CI || !!process.env.CI;
const chrome = { ...devices['Desktop Chrome'], userAgent: INTEGRATION_TEST_USER_AGENT };
const isDebug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

const adminStorageState = path.resolve(__dirname, 'e2e', '.auth', 'kubeadmin.json');
const developerStorageState = path.resolve(__dirname, 'e2e', '.auth', 'developer.json');
const hasDeveloper = !!process.env.BRIDGE_HTPASSWD_USERNAME;

const packages = [
  'smoke',
  'console',
  'dev-console',
  'helm',
  'knative',
  'olm',
  'telemetry',
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
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 120_000,
  reporter: isCI
    ? [
        ['dot'],
        ['junit', { outputFile: path.resolve(__dirname, 'test-results', 'junit-results.xml') }],
        ['html', { outputFolder: path.resolve(__dirname, 'playwright-report'), open: 'never' }],
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

  workers: process.env.WORKERS ? parseInt(process.env.WORKERS, 10) : isCI ? 1 : undefined,

  projects: [
    {
      name: 'cluster-setup',
      testDir: path.resolve(__dirname, 'e2e', 'setup'),
      testMatch: 'cluster.setup.ts',
      teardown: 'teardown',
    },
    {
      name: 'admin-auth',
      testDir: path.resolve(__dirname, 'e2e', 'setup'),
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
      testDir: path.resolve(__dirname, 'e2e', 'setup'),
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
      testDir: path.resolve(__dirname, 'e2e', 'setup'),
      testMatch: 'teardown.setup.ts',
    },

    ...packages.map((pkg) => ({
      name: pkg,
      testDir: path.resolve(__dirname, 'e2e', 'tests', pkg),
      testIgnore: '**/developer/**',
      dependencies: ['admin-auth'],
      use: {
        ...chrome,
        storageState: adminStorageState,
      },
    })),
    ...(hasDeveloper
      ? devPackages.map((pkg) => ({
          name: `${pkg}-developer`,
          testDir: path.resolve(__dirname, 'e2e', 'tests', pkg, 'developer'),
          dependencies: ['developer-auth'],
          use: {
            ...chrome,
            storageState: developerStorageState,
          },
        }))
      : []),
  ],
});
