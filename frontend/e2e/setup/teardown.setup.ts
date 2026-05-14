import * as fs from 'fs';
import * as path from 'path';

import { test as teardown, expect } from '@playwright/test';

import KubernetesClient from '../clients/kubernetes-client';

const CONFIG_FILE = path.resolve(import.meta.dirname, '..', '.test-config.json');

teardown('delete test namespace', async () => {
  teardown.skip(
    process.env.DEBUG === '1' || process.env.DEBUG === 'true',
    'Debug mode — preserving namespace',
  );

  if (!fs.existsSync(CONFIG_FILE)) {
    return;
  }

  let testNamespace: string | undefined;
  let kubeConfigPath: string | undefined;
  let authToken: string | undefined;

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    testNamespace = config.testNamespace;
    kubeConfigPath = config.kubeConfigPath;
    authToken = config.authToken;
  } catch {
    return;
  }

  if (!testNamespace) {
    return;
  }

  const client = new KubernetesClient(
    {
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
      token: authToken,
    },
    kubeConfigPath,
  );

  await client.deleteNamespace(testNamespace);
  const deleted = await client.waitForNamespaceDeleted(testNamespace, 120_000);
  expect(deleted, `Namespace ${testNamespace} should be deleted within 120s`).toBe(true);
});
