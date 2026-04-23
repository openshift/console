import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, 'e2e', '.env') });

import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.OPENSHIFT_CI;
const isDebug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

const chromeArgs = [
  '--ignore-certificate-errors',
  '--start-maximized',
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
  globalSetup: path.resolve(__dirname, 'e2e', 'global.setup.ts'),
  globalTeardown: path.resolve(__dirname, 'e2e', 'global.teardown.ts'),
  testDir: './e2e/tests',
  testMatch: '**/*.spec.ts',
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 120_000,
  reporter: isCI
    ? [
        ['dot'],
        ['junit', { outputFile: path.resolve(__dirname, 'test-results', 'junit-results.xml') }],
      ]
    : [['list']],

  expect: {
    timeout: 40_000,
  },

  use: {
    testIdAttribute: 'data-test',
    baseURL,
    actionTimeout: 60_000,
    navigationTimeout: 90_000,
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
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.resolve(__dirname, 'e2e', '.auth', 'kubeadmin.json'),
      },
    },
    ...(process.env.BRIDGE_HTPASSWD_USERNAME
      ? [
          {
            name: 'developer',
            use: {
              ...devices['Desktop Chrome'],
              storageState: path.resolve(__dirname, 'e2e', '.auth', 'developer.json'),
            },
          },
        ]
      : []),
  ],
});
