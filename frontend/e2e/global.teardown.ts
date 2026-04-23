import * as fs from 'fs';
import * as path from 'path';

import KubernetesClient from './clients/kubernetes-client';

const CONFIG_FILE = path.resolve(__dirname, '.test-config.json');

async function globalTeardown() {
  if (process.env.DEBUG === '1' || process.env.DEBUG === 'true') {
    console.log('🐛 Debug mode — skipping teardown');
    return;
  }

  console.log('🧹 Cleaning up test environment...');

  // Read test config to get namespace
  let testNamespace: string | undefined;
  let kubeConfigPath: string | undefined;
  let authToken: string | undefined;

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      testNamespace = config.testNamespace;
      kubeConfigPath = config.kubeConfigPath;
      authToken = config.authToken;
    } catch {
      // config file corrupted — skip cleanup
    }
  }

  if (!testNamespace) {
    console.log('No test namespace to clean up');
    return;
  }

  try {
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
    if (deleted) {
      console.log(`✅ Namespace ${testNamespace} deleted`);
    } else {
      console.warn(`⚠️  Namespace ${testNamespace} still terminating after 120s`);
    }
  } catch (err) {
    console.warn(`⚠️  Failed to clean up namespace ${testNamespace}: ${err}`);
  }

  console.log('🏁 Teardown complete');
}

export default globalTeardown;
