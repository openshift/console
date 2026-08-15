import { test, expect } from '../../../../fixtures';
import { warmupSPA } from '../../../../pages/base-page';
import { DetailsPage } from '../../../../pages/details-page';
import { SecretsPage } from '../../../../pages/secrets-page';

test.describe('Add Secret to Workloads', () => {
  let namespace: string;
  const secretName = 'test-secret';
  const resourceName = 'test-deploy';
  const envPrefix = 'env-';
  const mountPath = '/tmp/testdata';

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `test-add-to-wl-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);

    await k8sClient.createDeployment(namespace, {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: resourceName, namespace },
      spec: {
        selector: { matchLabels: { test: 'add-secret-to-workload' } },
        template: {
          metadata: { labels: { test: 'add-secret-to-workload' } },
          spec: {
            containers: [
              {
                name: 'httpd',
                image:
                  'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
              },
            ],
          },
        },
      },
    });

    await k8sClient.createSecret(secretName, namespace, {
      key1: Buffer.from('supersecret').toString('base64'),
    });
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test('adds secret to deployment as environment variables', async ({ page, k8sClient }) => {
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);

    await test.step('Navigate to secret details', async () => {
      await warmupSPA(page);
      await secretsPage.navigateToSecretDetails(namespace, secretName);
      await detailsPage.waitForPageLoad();
    });

    await test.step('Add secret as env vars via modal', async () => {
      await secretsPage.addToWorkload(resourceName, 'environment', { prefix: envPrefix });
    });

    await test.step('Verify deployment has envFrom', async () => {
      const deployment = await k8sClient.appsV1Api.readNamespacedDeployment({
        name: resourceName,
        namespace,
      });
      const envFrom = deployment.spec?.template?.spec?.containers?.[0]?.envFrom?.[0];
      expect(envFrom?.secretRef?.name).toBe(secretName);
      expect(envFrom?.prefix).toBe(envPrefix);
    });
  });

  test('adds secret to deployment as volume', async ({ page, k8sClient }) => {
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);

    await test.step('Navigate to secret details', async () => {
      await warmupSPA(page);
      await secretsPage.navigateToSecretDetails(namespace, secretName);
      await detailsPage.waitForPageLoad();
    });

    await test.step('Add secret as volume via modal', async () => {
      await secretsPage.addToWorkload(resourceName, 'volume', { mountPath });
    });

    await test.step('Verify deployment has volumeMount', async () => {
      const deployment = await k8sClient.appsV1Api.readNamespacedDeployment({
        name: resourceName,
        namespace,
      });
      const volumeMount = deployment.spec?.template?.spec?.containers?.[0]?.volumeMounts?.find(
        (vm) => vm.name === secretName,
      );
      expect(volumeMount?.name).toBe(secretName);
      expect(volumeMount?.mountPath).toBe(mountPath);
    });
  });
});
