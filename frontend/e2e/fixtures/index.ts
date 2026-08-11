import * as fs from 'fs';
import * as path from 'path';

import { test as base, expect } from '@playwright/test';

import KubernetesClient from '../clients/kubernetes-client';

import { attachSessionRecovery, awaitSessionRecovery, recoverSessionIfExpired } from './auth-fixture';
import type { CleanupFixture } from './cleanup-fixture';
import { createCleanupFixture } from './cleanup-fixture';

export interface SharedTestConfig {
  testNamespace: string;
  authToken?: string;
  kubeConfigPath?: string;
}

type TestFixtures = {
  cleanup: CleanupFixture;
};

type WorkerFixtures = {
  testConfig: SharedTestConfig;
  k8sClient: KubernetesClient;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Override the built-in page fixture to transparently recover from expired
  // sessions. Long runs can outlive the OAuth token captured in storageState;
  // without this, navigations silently redirect to the login page and tests
  // hang. A navigation listener re-authenticates the persona whenever a
  // navigation lands on the login page.
  //
  // We also wrap page.goto so that after every navigation the caller awaits any
  // recovery the navigation itself triggered — otherwise the action that hit
  // the expiry would race the background re-login and act on the login page.
  // This covers both raw page.goto calls in tests and BasePage.goTo.
  page: async ({ page }, use, testInfo) => {
    const detach = attachSessionRecovery(page, testInfo);
    const originalGoto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await originalGoto(url, options);
      // Drive recovery synchronously here rather than relying on the
      // framenavigated listener, whose dispatch can race goto resolving. This
      // call is guarded/idempotent: it no-ops when not on the login page and
      // joins any recovery the listener already started.
      await recoverSessionIfExpired(page, testInfo, 2_000);
      await awaitSessionRecovery(page);
      return response;
    };
    try {
      // Best-effort guard for a page that somehow starts on the login page; at
      // fixture setup the page is typically about:blank, so this usually no-ops
      // and the listener does the real work.
      await recoverSessionIfExpired(page, testInfo);
      await use(page);
    } finally {
      detach();
    }
  },

  testConfig: [
    async ({}, use) => {
      const configPath = path.resolve(import.meta.dirname, '..', '.test-config.json');
      let config: SharedTestConfig = {
        testNamespace: 'default',
      };
      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch {
          // fall through with defaults
        }
      }
      await use(config);
    },
    { scope: 'worker' },
  ],

  k8sClient: [
    async ({ testConfig }, use) => {
      const client = new KubernetesClient(
        {
          clusterUrl: process.env.CLUSTER_URL || '',
          username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
          password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
          token: testConfig.authToken,
        },
        testConfig.kubeConfigPath,
      );
      await use(client);
    },
    { scope: 'worker' },
  ],

  cleanup: async ({}, use, testInfo) => {
    const testName = testInfo.titlePath.join(' > ');
    const fixture = createCleanupFixture(testName);
    try {
      await use(fixture);
    } finally {
      if (!fixture.shouldSkipCleanup() && fixture.count > 0) {
        try {
          await fixture.executeCleanup();
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`[Cleanup] Failed for "${testName}": ${msg}`);
        }
      }
    }
  },
});

export { expect };
export type { CleanupFixture };
