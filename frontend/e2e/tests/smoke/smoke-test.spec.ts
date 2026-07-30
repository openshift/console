import { test, expect } from '../../fixtures';

test('console loads after setup', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toBeEmpty();
});
