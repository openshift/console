import { test, expect } from '../../fixtures';
import { ConfigMapPage } from '../../pages/dev-console/config-map-page';
import { DetailsPage } from '../../pages/details-page';
import { ListPage } from '../../pages/list-page';

test.describe('ConfigMap form view', { tag: ['@dev-console', '@smoke'] }, () => {
  test('creates a ConfigMap using form view', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-configmap-create-${Date.now()}`;
    const configMapName = 'test-config-map';
    const configMapPage = new ConfigMapPage(page);
    const detailsPage = new DetailsPage(page);

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Navigate to create form and fill fields', async () => {
      await configMapPage.navigateToCreateForm(ns);
      await configMapPage.fillName(configMapName);
      await configMapPage.fillKeyValue(0, 'test-key', 'test-value');
    });

    await test.step('Submit and verify details page', async () => {
      await configMapPage.save();
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(configMapName);
    });
  });

  test('edits a ConfigMap using form view', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-configmap-edit-${Date.now()}`;
    const configMapName = 'test-config-map';
    const configMapPage = new ConfigMapPage(page);
    const detailsPage = new DetailsPage(page);
    const listPage = new ListPage(page);

    await test.step('Set up namespace and create ConfigMap', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createConfigMap(configMapName, ns, { 'test-key': 'test-value' });
    });

    await test.step('Navigate to edit form', async () => {
      await configMapPage.navigateToEditForm(ns, configMapName);
      await expect(configMapPage.getEditHeading()).toBeVisible({
        timeout: 30_000,
      });
    });

    await test.step('Add a new key-value pair and save', async () => {
      await configMapPage.addKeyValue();
      await expect(configMapPage.getKeyInput(1)).toBeVisible();
      await configMapPage.getKeyInput(1).fill('key-test1');
      await configMapPage.getValueTextarea(1).fill('value-test1');
      await configMapPage.save();
    });

    await test.step('Verify details page shows new key', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(configMapName);
      await expect(configMapPage.getKeyText('key-test1')).toBeVisible();
    });
  });

  // eslint-disable-next-line playwright/expect-expect
  test('CFM-01-TC02: Edit ConfigMap via kebab menu', async () => {
    test.skip(true, 'Deferred — kebab Edit action opens YAML editor, not form editor');
  });
});
