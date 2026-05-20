import { test, expect } from '../../fixtures';
import { NavPage } from '../../pages/nav-page';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { CustomizationPage } from '../../pages/dev-console/customization-page';

test.describe('Configure perspectives', { tag: ['@regression', '@dev-console'] }, () => {
  test('configuring available perspectives via YAML - disable admin', async () => {
    test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
  });

  test('configuring available perspectives - add access review check', async () => {
    test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
  });

  test('configuring available perspectives - add empty perspectives', async () => {
    test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
  });

  test('enable dev perspective', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const navPage = new NavPage(page);
    const customizationPage = new CustomizationPage(page);

    await test.step('Navigate to admin perspective search page', async () => {
      await page.goto('/');
      await perspectivePage.switchToAdministrator();
    });

    await test.step('Search for console resource', async () => {
      await navPage.clickNavLink(['Home', 'Search']);
      const combobox = page.locator('[role="combobox"]');
      await combobox.click();
      const filterInput = page.locator('[aria-label="Type to filter"]');
      await filterInput.fill('console');
      const consoleItem = page.locator('[class="co-resource-item"]').filter({
        hasText: 'operator.openshift.io',
      });
      if ((await consoleItem.count()) > 0) {
        await consoleItem.click();
      } else {
        await page.locator('[class="co-resource-item"]').first().click();
      }
      await page
        .locator('button[aria-label="Clear input value"]')
        .click()
        .catch(() => {});
      await page.locator('body').click();
    });

    await test.step('Click on cluster', async () => {
      await customizationPage.clickCluster();
    });

    await test.step('Open customization and enable developer perspective', async () => {
      const customizeButton = page.locator('button[data-test-action="Customize"]');
      await customizeButton.click();
      await expect(page.locator('[data-test="page-heading"] h1')).toHaveText(
        'Cluster configuration',
      );
      await customizationPage.selectPerspectiveState('Enabled');
    });

    await test.step('Verify saved alert', async () => {
      await customizationPage.expectSuccessAlert();
    });

    await test.step('Verify developer perspective available', async () => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      const switcher = page.locator('[data-test-id="perspective-switcher-toggle"]');
      await switcher.click();
      await expect(
        page.locator('[data-test-id="perspective-switcher-menu-option"]').filter({
          hasText: 'Developer',
        }),
      ).toBeVisible();
    });
  });
});
