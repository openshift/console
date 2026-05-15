import * as fs from 'fs';
import * as path from 'path';

import { test as setup } from '@playwright/test';

import KubernetesClient from '../clients/kubernetes-client';

const CONFIG_FILE = path.resolve(import.meta.dirname, '..', '.test-config.json');

let k8sClient: KubernetesClient | null = null;
let clusterAvailable = false;

setup.describe.configure({ mode: 'serial' });

setup('verify cluster authentication', async () => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }

  const username = process.env.OPENSHIFT_USERNAME || 'kubeadmin';
  const password = process.env.BRIDGE_KUBEADMIN_PASSWORD || '';

  const clusterUrl = process.env.CLUSTER_URL || '';

  try {
    k8sClient = new KubernetesClient({ clusterUrl, username, password });
    await k8sClient.verifyAuthentication();
    clusterAvailable = true;
  } catch (err) {
    if (clusterUrl) {
      throw new Error(`Cluster authentication failed for ${clusterUrl}: ${err}`);
    }
    k8sClient = null;
  }
});

setup('create test namespace and configure cluster', async () => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');
  setup.skip(!clusterAvailable, 'No cluster available');

  const testNamespace = `console-e2e-${Date.now()}`;

  await k8sClient!.createNamespace(testNamespace);
  await k8sClient!.waitForNamespaceReady(testNamespace);

  const username = process.env.OPENSHIFT_USERNAME || 'kubeadmin';
  try {
    await k8sClient!.setupConsoleUserSettings(username, testNamespace);
  } catch {
    // Non-critical — guided tour will be dismissed in browser if needed
  }

  const testConfig = {
    testNamespace,
    authToken: k8sClient!.getCurrentUserToken(),
    kubeConfigPath: process.env.KUBECONFIG,
  };
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(testConfig, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
});
