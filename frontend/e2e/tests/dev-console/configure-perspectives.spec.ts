import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';

test.describe('Configure perspectives', { tag: ['@dev-console', '@regression'] }, () => {
  test('verifies developer perspective is available in the switcher', async ({ page }) => {
    await warmupSPA(page);
    const toggle = page.getByTestId('perspective-switcher-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(
      page.getByTestId('perspective-switcher-menu-option').filter({ hasText: 'Developer' }),
    ).toBeVisible();
  });
});
