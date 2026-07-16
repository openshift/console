import * as fs from 'fs';
import * as path from 'path';

import { test as base, expect } from '@playwright/test';

import KubernetesClient from '../clients/kubernetes-client';

import type { CleanupFixture } from './cleanup-fixture';
import { createCleanupFixture } from './cleanup-fixture';

export interface SharedTestConfig {
  testNamespace: string;
  authToken?: string;
  kubeConfigPath?: string;
}

type TestFixtures = {
  cleanup: CleanupFixture;
  techPreviewOnly: void;
  requireFeatureGate: (gateName: string) => Promise<void>;
};

type WorkerFixtures = {
  testConfig: SharedTestConfig;
  k8sClient: KubernetesClient;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
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

  techPreviewOnly: async ({ page }, use) => {
    const isTechPreview = await page.evaluate(() => window.SERVER_FLAGS.techPreview);
    test.skip(!isTechPreview, 'This test requires a TechPreviewNoUpgrade cluster');
    await use();
  },

  requireFeatureGate: async ({ k8sClient }, use) => {
    await use(async (gateName: string) => {
      let enabled: string[] = [];
      try {
        const fg = await k8sClient.getClusterCustomResource(
          'config.openshift.io',
          'v1',
          'featuregates',
          'cluster',
        );
        const featureSet: string = (fg as any)?.spec?.featureSet ?? '';
        const sections: any[] = (fg as any)?.status?.featureGates ?? [];
        const section = sections.find((s: any) => s.featureSet === featureSet);
        enabled = (section?.enabled ?? []).map((g: any) => String(g.name));
      } catch {
        // If the CR can't be read, skip rather than fail
      }
      test.skip(
        !enabled.includes(gateName),
        `Feature gate '${gateName}' is not enabled on this cluster`,
      );
    });
  },

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
