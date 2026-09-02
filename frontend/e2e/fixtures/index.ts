import * as fs from 'fs';
import * as path from 'path';

import { test as base, expect } from '@playwright/test';

import KubernetesClient from '../clients/kubernetes-client';
import { loginFromEnv } from '../setup/login-helper';

import type { CleanupFixture } from './cleanup-fixture';
import { createCleanupFixture } from './cleanup-fixture';

// URLs the console redirects to when a shared storageState session expires or is
// invalidated (e.g. by a console rollout in another spec). Matches the OAuth
// server and the console's own login route.
const OAUTH_REDIRECT_RE = /\/oauth\/|oauth-openshift|\/auth\/login\b/;

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
  // Override the built-in `page` fixture to self-heal lost sessions. When any
  // navigation is bounced to the OAuth login page — during warmup or mid-test —
  // re-authenticate the current persona and retry the original target so the
  // caller transparently lands on the page it asked for. loginFromEnv returns
  // quickly when the OAuth SSO cookie is still valid (the flow auto-completes)
  // and resubmits credentials when it isn't. Persona is derived from the project
  // name, matching the storageState mapping in playwright.config.ts.
  //
  // Tests that assert on session/auth behavior directly (e.g. session
  // persistence across pod restarts) must opt out with a
  // `{ type: 'no-auto-reauth' }` annotation, otherwise transparent recovery
  // would mask the very failure they check for.
  page: async ({ page }, use, testInfo) => {
    if (testInfo.annotations.some((a) => a.type === 'no-auto-reauth')) {
      await use(page);
      return;
    }
    const persona = testInfo.project.name.endsWith('-developer') ? 'developer' : 'admin';
    const originalGoto = page.goto.bind(page);
    let recovering = false;

    const recoverIfRedirectedToLogin = async (): Promise<boolean> => {
      // Guard against re-entrancy: loginFromEnv navigates internally, and those
      // navigations flow back through this override.
      if (recovering || !OAUTH_REDIRECT_RE.test(page.url())) {
        return false;
      }
      recovering = true;
      try {
        await loginFromEnv(page, persona);
      } finally {
        recovering = false;
      }
      return true;
    };

    page.goto = async (url, options) => {
      const response = await originalGoto(url, options);
      // The console redirects to the OAuth login page client-side, a beat after
      // the initial document loads, so `page.url()` can still read the target
      // right after goto resolves. Wait for auth to settle before deciding: the
      // console boots with a `co-auth-pending` class on <html> and removes it
      // once its authenticated bootstrap fetch succeeds (see public/components/
      // app.tsx); a 401 instead redirects to OAuth. Race that class dropping
      // against the OAuth redirect so we neither miss the redirect nor stall the
      // happy path.
      if (!recovering) {
        // eslint-disable-next-line no-restricted-syntax -- waiting for state, no action follows
        const authSettled = page.locator('html:not(.co-auth-pending)').waitFor({ state: 'attached', timeout: 30_000 });
        const redirectedToLogin = page.waitForURL(OAUTH_REDIRECT_RE, { timeout: 30_000 });
        await Promise.race([authSettled.catch(() => {}), redirectedToLogin.catch(() => {})]);
      }
      if (await recoverIfRedirectedToLogin()) {
        return originalGoto(url, options);
      }
      return response;
    };

    await use(page);
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
