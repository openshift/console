import { test, expect } from '../../../fixtures';

test('console loads in developer perspective', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByTestId('perspective-switcher-toggle'),
  ).toContainText('Developer', { timeout: 60_000 });
});
