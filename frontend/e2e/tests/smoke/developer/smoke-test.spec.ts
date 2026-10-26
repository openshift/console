import { test, expect } from '../../../fixtures';
import { ensureDeveloperPerspective, warmupSPA } from '../../../pages/base-page';

test('console loads in developer perspective', async ({ page, k8sClient }) => {
  await warmupSPA(page);

  // The Developer perspective ships disabled (Console CR
  // spec.customization.perspectives), so the console renders a single,
  // non-interactive "Core platform" heading until it is turned on. Enable it
  // the same way the dev-console specs do before asserting on it.
  await ensureDeveloperPerspective(page, k8sClient);

  const toggle = page.getByTestId('perspective-switcher-toggle');
  await toggle.click();
  await page
    .getByTestId('perspective-switcher-menu-option')
    .filter({ hasText: 'Developer' })
    .click();

  await expect(toggle).toContainText('Developer', { timeout: 60_000 });
});
