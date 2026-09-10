import { test, expect } from '../../fixtures';
import { CatalogPage } from '../../pages/catalog-page';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { generateTestNamespace } from '../../test-utils/test-namespace';

const operatorName = '3scale API Management';
const operatorPackageName = '3scale-community-operator';

test.describe('Create namespace from install operators', { tag: ['@admin'] }, () => {
  test('creates namespace from operator install page', async ({ page, cleanup }) => {
    test.setTimeout(180_000);

    const catalogPage = new CatalogPage(page);
    const installPage = new OperatorInstallPage(page);

    await catalogPage.navigateToOperatorCatalog('default');
    // OLMv1 is enabled by default on techPreview clusters, replacing the OLMv0
    // OperatorHub catalog with an empty Software Catalog. Skip instead of timing out.
    const isTechPreview = await page.evaluate(() => Boolean(window.SERVER_FLAGS?.techPreview));
    test.skip(
      isTechPreview,
      'OLMv1 is active on techPreview clusters — OLMv0 OperatorHub catalog is unavailable',
    );

    const nsName = generateTestNamespace();
    cleanup.trackNamespace(nsName);
    cleanup.trackCustomResource(
      operatorPackageName,
      nsName,
      'operators.coreos.com',
      'v1alpha1',
      'subscriptions',
    );

    await test.step('Navigate to catalog and open operator details', async () => {
      await catalogPage.toggleSourceFilter('community');
      await catalogPage.searchOperators(operatorName);
      await catalogPage.clickOperatorCard(operatorName);
    });

    await test.step('Click Install in operator details modal', async () => {
      await installPage.clickDetailsModalInstall();
    });

    await test.step('Select single namespace installation mode', async () => {
      await installPage.selectSpecificNamespaceMode();
    });

    await test.step('Create a new namespace from the dropdown', async () => {
      await installPage.createNamespaceFromDropdown(nsName);
    });

    await test.step('Verify the dropdown shows the new namespace', async () => {
      await expect(installPage.getNamespaceDropdown()).toContainText(nsName);
    });

    await test.step('Install the operator and verify success', async () => {
      await installPage.clickInstallOperator();
      await expect(installPage.getViewInstalledOperatorsButton()).toContainText(
        `View installed Operators in Namespace ${nsName}`,
        { timeout: 60_000 },
      );
    });
  });
});
