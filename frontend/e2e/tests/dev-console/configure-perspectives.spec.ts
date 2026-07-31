import { test, expect } from '../../fixtures';
import BasePage, { warmupSPA } from '../../pages/base-page';

class PerspectivePage extends BasePage {
  getPerspectiveToggle() {
    return this.page.getByTestId('perspective-switcher-toggle');
  }

  getPerspectiveOption(name: string) {
    return this.page
      .getByTestId('perspective-switcher-menu-option')
      .filter({ hasText: name });
  }
}

test.describe('Configure perspectives', { tag: ['@dev-console', '@regression'] }, () => {
  test('verifies developer perspective is available in the switcher', async ({ page }) => {
    await warmupSPA(page);
    const perspectivePage = new PerspectivePage(page);
    await expect(perspectivePage.getPerspectiveToggle()).toBeVisible();
    await perspectivePage.getPerspectiveToggle().click();
    await expect(perspectivePage.getPerspectiveOption('Developer')).toBeVisible();
  });
});
