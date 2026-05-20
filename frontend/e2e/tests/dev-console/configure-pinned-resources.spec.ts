import { test, expect } from '../../fixtures';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';

test.describe('Configure pinned resources', { tag: ['@regression', '@dev-console'] }, () => {
  test(
    'user has not configured the pre-pinned resources',
    { tag: ['@smoke'] },
    async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);

      await test.step('Navigate to developer perspective', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
      });

      await test.step('Verify default pinned resources', async () => {
        const pinnedItems = page.locator('[data-test="draggable-pinned-resource-item"]');
        await expect(pinnedItems.filter({ hasText: 'Secrets' })).toBeVisible();
        await expect(pinnedItems.filter({ hasText: 'ConfigMaps' })).toBeVisible();
      });
    },
  );

  test('configuring pre-pinned resources', async () => {
    test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
  });

  test('user customizing pinned resources on developer perspective navigation', async () => {
    test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
  });

  test('user removing the pinnedResources customization from console config', async () => {
    test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
  });
});
