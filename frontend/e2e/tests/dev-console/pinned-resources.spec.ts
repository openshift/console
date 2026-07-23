import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { AddPage } from '../../pages/dev-console/add-page';

test.describe(
  'Configure pinned resources',
  { tag: ['@dev-console', '@perspective'] },
  () => {
    test(
      'CPR-01-TC01: Default pinned resources are visible in Developer perspective',
      { tag: ['@smoke'] },
      async ({ page }) => {
        await warmupSPA(page);

        const addPage = new AddPage(page);
        await addPage.switchPerspective('Developer');

        await test.step('Verify Secrets is pinned in navigation', async () => {
          await expect(addPage.getPinnedResource('Secrets')).toBeVisible({
            timeout: 30_000,
          });
        });

        await test.step('Verify ConfigMaps is pinned in navigation', async () => {
          await expect(addPage.getPinnedResource('ConfigMaps')).toBeVisible();
        });
      },
    );
  },
);
