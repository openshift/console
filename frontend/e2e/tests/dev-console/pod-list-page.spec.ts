import { test } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { NavPage } from '../../pages/nav-page';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { PodListPage } from '../../pages/dev-console/pod-list-page';

test.describe('Traffic Status details for pods', { tag: ['@regression', '@dev-console'] }, () => {
  const namespace = `aut-pods-${Date.now()}`;
  let k8s: KubernetesClient;

  test.beforeAll(async () => {
    k8s = new KubernetesClient({
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    });
    await k8s.createNamespace(namespace);

    await k8s.appsV1Api.createNamespacedDeployment({
      namespace,
      body: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'nodejs-ex-git', namespace },
        spec: {
          replicas: 1,
          selector: { matchLabels: { app: 'nodejs-ex-git' } },
          template: {
            metadata: { labels: { app: 'nodejs-ex-git' } },
            spec: {
              containers: [
                {
                  name: 'nodejs-ex-git',
                  image: 'registry.access.redhat.com/ubi8/nodejs-18:latest',
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                },
              ],
            },
          },
        },
      },
    });

    await k8s
      .waitForCustomResourceCondition(
        'apps',
        'v1',
        namespace,
        'deployments',
        'nodejs-ex-git',
        (resource: any) => resource?.status?.availableReplicas > 0,
        120_000,
      )
      .catch(() => {
        // Deployment may not be fully ready, but we need pods to exist
      });
  });

  test.afterAll(async () => {
    await k8s.deleteNamespace(namespace);
  });

  test('check traffic status for pods in a project', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const navPage = new NavPage(page);
    const podListPage = new PodListPage(page);

    await test.step('Navigate to administrator pods tab', async () => {
      await page.goto('/');
      await perspectivePage.switchToAdministrator();
      await perspectivePage.selectOrCreateProject(namespace);
      await navPage.clickNavLink(['Workloads', 'Pods']);
    });

    await test.step('Enable Receiving Traffic column', async () => {
      await podListPage.enableReceivingTrafficColumn();
    });

    await test.step('Verify Receiving Traffic column is visible', async () => {
      await podListPage.expectReceivingTrafficColumnVisible();
    });
  });

  test('check traffic status for pods for all projects', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const navPage = new NavPage(page);
    const podListPage = new PodListPage(page);

    await test.step('Navigate to administrator pods tab', async () => {
      await page.goto('/');
      await perspectivePage.switchToAdministrator();
      await perspectivePage.selectOrCreateProject('All Projects');
      await navPage.clickNavLink(['Workloads', 'Pods']);
    });

    await test.step('Enable Receiving Traffic column', async () => {
      await podListPage.enableReceivingTrafficColumn();
    });

    await test.step('Verify Receiving Traffic column is visible', async () => {
      await podListPage.expectReceivingTrafficColumnVisible();
    });
  });
});
