import { test } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { DetailsPage } from '../../pages/details-page';
import { ListPage } from '../../pages/list-page';
import { ConfigMapPage } from '../../pages/dev-console/config-map-page';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';

test.describe('Config maps form view', { tag: ['@smoke', '@dev-console'] }, () => {
  const namespace = `aut-config-map-${Date.now()}`;
  let k8s: KubernetesClient;

  test.beforeAll(async () => {
    k8s = new KubernetesClient({
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    });
    await k8s.createNamespace(namespace);
  });

  test.afterAll(async () => {
    await k8s.deleteNamespace(namespace);
  });

  test('create config map using form view', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const configMapPage = new ConfigMapPage(page);
    const detailsPage = new DetailsPage(page);

    await test.step('Navigate to ConfigMaps', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToConfigMaps();
    });

    await test.step('Create config map', async () => {
      await configMapPage.createConfigMap('test-config-map', 'test-key', 'test-value');
    });

    await test.step('Verify config map details', async () => {
      await detailsPage.titleShouldContain('test-config-map');
    });
  });

  test('edit config map using form view', { tag: ['@regression'] }, async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const configMapPage = new ConfigMapPage(page);
    const detailsPage = new DetailsPage(page);
    const listPage = new ListPage(page);
    const configMapName = `test-config-map1-${Date.now()}`;

    await test.step('Create config map via API', async () => {
      await k8s.coreV1Api.createNamespacedConfigMap({
        namespace,
        body: {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          metadata: { name: configMapName, namespace },
          data: { 'test-key': 'test-value' },
        },
      });
    });

    await test.step('Navigate to ConfigMaps list', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToConfigMaps();
    });

    await test.step('Open kebab menu and click Edit', async () => {
      const row = listPage.resourceRow(configMapName);
      await row.locator('[data-test-id="kebab-button"]').click();
      await page.locator('[data-test-action="Edit ConfigMap"]').click({ force: true });
    });

    await test.step('Add a new key-value pair', async () => {
      await configMapPage.addKeyValue();
      await configMapPage.fillSecondKey('key-test1');
      await configMapPage.submitForm();
    });

    await test.step('Verify updated config map', async () => {
      await detailsPage.titleShouldContain(configMapName);
      await configMapPage.expectDataSectionToContain('key-test1');
    });
  });
});
