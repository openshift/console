import { test, expect } from '../../fixtures';
import { HelmPage } from '../../pages/helm-page';

test.describe('Helm Chart Installation View', { tag: ['@helm'] }, () => {
  test('non-configurable Helm release shows info message: HR-04-TC04', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-noconfig-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to catalog and select a non-configurable chart', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart('Httpd Imagestreams');
    });

    await test.step('Open Create Helm Release form', async () => {
      await helmPage.clickCreateOnSidePane();
    });

    await test.step('Verify non-configurable message is displayed', async () => {
      const alertMessage = page.locator('h4[class$="alert__title"]');
      await expect(alertMessage).toContainText(
        "Helm release is not configurable since the Helm Chart doesn't define any values.",
        { timeout: 30_000 },
      );
    });
  });

  test('Grouping of Helm multiple chart versions: HR-04-TC01', async () => {
    test.skip(true, 'Known broken - only one version of Nodejs chart available');
  });

  test('Switch from YAML to Form view: HR-04-TC02', async () => {
    test.skip(true, 'Manual test');
  });

  test('Data does not change while switching Form to YAML view: HR-04-TC03', async () => {
    test.skip(true, 'Known broken - replica count field no longer exists in the form');
  });
});
