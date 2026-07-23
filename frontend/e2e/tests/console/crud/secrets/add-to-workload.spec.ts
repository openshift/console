import { test, expect } from '../../../../fixtures';
import { warmupSPA } from '../../../../pages/base-page';
import { SecretPage } from '../../../../pages/secret-page';

test.describe('Add Secret to Workloads', { tag: ['@admin', '@crud'] }, () => {
  test('adds secret to deployment as environment variables', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `test-secret-env-${Date.now()}`;
    const secretName = 'test-secret';
    const deployName = 'test-deploy';
    const envPrefix = 'env-';
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace, deployment, and secret', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createDeployment(ns, {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: deployName, namespace: ns },
        spec: {
          selector: { matchLabels: { test: 'add-secret-to-workload' } },
          template: {
            metadata: { labels: { test: 'add-secret-to-workload' } },
            spec: {
              containers: [
                {
                  name: 'httpd',
                  image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
                },
              ],
            },
          },
        },
      } as any);
      await k8sClient.createSecret(ns, {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: secretName, namespace: ns },
        stringData: { key1: 'supersecret' },
      } as any);
    });

    await test.step('Add secret as env vars', async () => {
      await warmupSPA(page);
      await page.goto(`/k8s/ns/${ns}/secrets/${secretName}`);
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.addToWorkload(deployName, 'environment', { prefix: envPrefix });
    });

    await test.step('Verify env vars via API', async () => {
      const deploy = (await k8sClient.getDeployment(deployName, ns)) as any;
      const envFrom = deploy.spec.template.spec.containers[0].envFrom;
      expect(envFrom).toBeDefined();
      const secretEnv = envFrom.find((e: any) => e.secretRef?.name === secretName);
      expect(secretEnv).toBeDefined();
      expect(secretEnv.prefix).toBe(envPrefix);
    });
  });

  test('adds secret to deployment as volume', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-secret-vol-${Date.now()}`;
    const secretName = 'test-secret';
    const deployName = 'test-deploy';
    const mountPath = '/tmp/testdata';
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace, deployment, and secret', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createDeployment(ns, {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: deployName, namespace: ns },
        spec: {
          selector: { matchLabels: { test: 'add-secret-to-workload' } },
          template: {
            metadata: { labels: { test: 'add-secret-to-workload' } },
            spec: {
              containers: [
                {
                  name: 'httpd',
                  image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
                },
              ],
            },
          },
        },
      } as any);
      await k8sClient.createSecret(ns, {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: secretName, namespace: ns },
        stringData: { key1: 'supersecret' },
      } as any);
    });

    await test.step('Add secret as volume', async () => {
      await warmupSPA(page);
      await page.goto(`/k8s/ns/${ns}/secrets/${secretName}`);
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.addToWorkload(deployName, 'volume', { mountPath });
    });

    await test.step('Verify volume mount via API', async () => {
      const deploy = (await k8sClient.getDeployment(deployName, ns)) as any;
      const volumeMounts = deploy.spec.template.spec.containers[0].volumeMounts;
      expect(volumeMounts).toBeDefined();
      const secretMount = volumeMounts.find((m: any) => m.name === secretName);
      expect(secretMount).toBeDefined();
      expect(secretMount.mountPath).toBe(mountPath);
    });
  });
});
