import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';

test.describe('Node terminal', { tag: ['@admin'] }, () => {
  test('opens a debug terminal on a node', async ({ page }) => {
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);

    await test.step('Navigate to Nodes list', async () => {
      await page.goto('/k8s/cluster/nodes');
      await expect(listPage.heading).toContainText('Nodes');
      await listPage.waitForRows();
    });

    await test.step('Open first node details', async () => {
      await listPage.clickFirstRowLink();
      await detailsPage.waitForLoaded();
    });

    await test.step('Verify terminal loads without errors', async () => {
      await detailsPage.selectTab('Terminal');
      await expect(detailsPage.nodeTerminalError).not.toBeAttached();
      await expect(detailsPage.xtermViewport).toBeVisible({ timeout: 60_000 });
    });

    // Navigate away from Terminal so the temporary debug namespace is deleted
    await test.step('Navigate back to Overview', async () => {
      await detailsPage.selectTab('Overview');
    });
  });
});
