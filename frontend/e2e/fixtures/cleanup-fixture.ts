import * as fs from 'fs';
import * as path from 'path';

import KubernetesClient from '../clients/kubernetes-client';

export interface TrackedResource {
  name: string;
  namespace?: string;
  apiGroup: string;
  apiVersion: string;
  plural: string;
  type: string;
}

export interface CleanupFixture {
  track(resource: TrackedResource): void;
  trackNamespace(name: string): void;
  trackCustomResource(
    name: string,
    namespace: string,
    apiGroup: string,
    apiVersion: string,
    plural: string,
    type?: string,
  ): void;
  readonly count: number;
  executeCleanup(): Promise<void>;
  shouldSkipCleanup(): boolean;
}

export function createCleanupFixture(testName: string): CleanupFixture {
  const resources: TrackedResource[] = [];
  const skipCleanup =
    process.env.SKIP_TEST_CLEANUP === 'true' ||
    process.env.DEBUG === '1' ||
    process.env.DEBUG === 'true';

  function getClient(): KubernetesClient | null {
    try {
      const configPath = path.resolve(__dirname, '..', '.test-config.json');
      let kubeConfigPath: string | undefined;
      let authToken: string | undefined;
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        kubeConfigPath = config.kubeConfigPath;
        authToken = config.authToken;
      }
      return new KubernetesClient(
        {
          clusterUrl: process.env.CLUSTER_URL || '',
          username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
          password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
          token: authToken,
        },
        kubeConfigPath,
      );
    } catch (err) {
      console.warn(
        `[Cleanup] Failed to create K8s client: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  return {
    track(resource: TrackedResource) {
      resources.push(resource);
    },

    trackNamespace(name: string) {
      resources.push({
        name,
        apiGroup: '',
        apiVersion: 'v1',
        plural: 'namespaces',
        type: 'Namespace',
      });
    },

    trackCustomResource(
      name: string,
      namespace: string,
      apiGroup: string,
      apiVersion: string,
      plural: string,
      type?: string,
    ) {
      resources.push({
        name,
        namespace,
        apiGroup,
        apiVersion,
        plural,
        type: type || plural,
      });
    },

    get count() {
      return resources.length;
    },

    shouldSkipCleanup() {
      return skipCleanup;
    },

    async executeCleanup() {
      if (skipCleanup || resources.length === 0) {
        return;
      }

      const client = getClient();
      if (!client) {
        console.warn(`[Cleanup] No K8s client available for "${testName}"`);
        return;
      }

      const namespaces = resources.filter((r) => r.type === 'Namespace');
      const others = resources.filter((r) => r.type !== 'Namespace');

      // Delete non-namespace resources first
      for (const resource of others) {
        try {
          if (resource.apiGroup === '' && resource.namespace) {
            switch (resource.type) {
              case 'ConfigMap':
                await client.deleteConfigMap(resource.name, resource.namespace);
                break;
              case 'Secret':
                await client.deleteSecret(resource.name, resource.namespace);
                break;
              default:
                console.warn(
                  `[Cleanup] Unhandled core resource type ${resource.type} "${resource.name}" — skipping`,
                );
                break;
            }
          } else if (resource.namespace) {
            await client.deleteCustomResource(
              resource.apiGroup,
              resource.apiVersion,
              resource.namespace,
              resource.plural,
              resource.name,
            );
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (!msg.includes('404') && !msg.includes('not found')) {
            console.warn(`[Cleanup] Failed to delete ${resource.type} ${resource.name}: ${msg}`);
          }
        }
      }

      // Then delete namespaces
      for (const ns of namespaces) {
        try {
          await client.deleteNamespace(ns.name);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (!msg.includes('404') && !msg.includes('not found')) {
            console.warn(`[Cleanup] Failed to delete namespace ${ns.name}: ${msg}`);
          }
        }
      }

      // Wait for namespaces to terminate
      for (const ns of namespaces) {
        await client.waitForNamespaceDeleted(ns.name, 60_000).catch(() => {
          console.warn(`[Cleanup] Namespace ${ns.name} did not terminate within timeout`);
        });
      }
    },
  };
}
