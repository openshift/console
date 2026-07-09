import { test, expect } from '../../fixtures';
import BasePage, { warmupSPA } from '../../pages/base-page';

class PerspectiveHelper extends BasePage {}

test.describe(
  'Configure pinned resources',
  { tag: ['@dev-console', '@perspective'] },
  () => {
    test(
      'CPR-01-TC01: Default pinned resources are visible in Developer perspective',
      { tag: ['@smoke'] },
      async ({ page }) => {
        await warmupSPA(page);

        const helper = new PerspectiveHelper(page);
        await helper.switchPerspective('Developer');

        await test.step('Verify Secrets is pinned in navigation', async () => {
          const pinnedItems = helper.getPinnedResourceItems();
          await expect(pinnedItems.filter({ hasText: 'Secrets' })).toBeVisible({
            timeout: 30_000,
          });
        });

        await test.step('Verify ConfigMaps is pinned in navigation', async () => {
          const pinnedItems = helper.getPinnedResourceItems();
          await expect(pinnedItems.filter({ hasText: 'ConfigMaps' })).toBeVisible();
        });
      },
    );
  },
);
