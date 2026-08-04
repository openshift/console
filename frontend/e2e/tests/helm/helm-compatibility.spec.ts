import { test, expect } from '../../fixtures';
import { HelmPage } from '../../pages/helm-page';

test.describe('Helm Chart Compatibility', { tag: ['@helm'] }, () => {
  test('compatible helm charts are displayed in catalog: HR-02-TC01', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-compat-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to catalog and select Helm Charts type', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
    });

    await test.step('Verify Helm chart cards are displayed', async () => {
      const catalogCards = page.locator('[data-test^="HelmChart-"]');
      await expect(catalogCards.first()).toBeVisible({ timeout: 60_000 });
      const count = await catalogCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('Check meta data for importing helm charts from index.yaml: HR-02-TC02', async () => {
    test.skip(true, 'Manual test - requires inspecting Network tab');
  });

  test('Check chart versions compatible with cluster: HR-02-TC03', async () => {
    test.skip(true, 'Manual test - requires verifying kubeversion compatibility');
  });
});
