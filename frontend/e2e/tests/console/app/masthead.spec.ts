import { test, expect } from '../../../fixtures';
import { MastheadPage } from '../../../pages/masthead-page';

test.describe('Masthead', { tag: ['@admin'] }, () => {
  test('logo should be restricted to a max-height of 60px', async ({ page }) => {
    const masthead = new MastheadPage(page);
    await page.goto('/');

    await expect(masthead.logoLocator).toBeVisible();
    await expect(masthead.logoLocator).toHaveCSS('max-height', '60px');

    const height = await masthead.logoLocator.evaluate(
      (el: HTMLElement) => el.getBoundingClientRect().height,
    );
    expect(height).toBeLessThanOrEqual(60);
  });

  const quickCreateItems = [
    { testId: 'qc-import-yaml', heading: 'Import YAML' },
    { testId: 'qc-import-from-git', heading: 'Import from Git' },
    { testId: 'qc-container-images', heading: 'Deploy Image' },
  ] as const;

  for (const { testId, heading } of quickCreateItems) {
    test(`quick create should open ${heading}`, async ({ page }) => {
      const masthead = new MastheadPage(page);
      await page.goto('/');

      await test.step('Open quick create and click item', async () => {
        await masthead.openQuickCreate();
        await masthead.clickQuickCreateItem(testId);
      });

      await test.step('Verify page heading', async () => {
        await expect(masthead.pageHeading).toContainText(heading, { timeout: 30_000 });
      });
    });
  }

  test('should render the correct copy login command link', async ({ page }) => {
    const masthead = new MastheadPage(page);
    await page.goto('/');

    const authDisabled = await masthead.isAuthDisabled();
    test.skip(authDisabled, 'Auth is disabled — skipping copy login command test');

    await test.step('Open user dropdown and click copy login command', async () => {
      await masthead.openUserDropdown();
      await masthead.clickCopyLoginCommand();
    });

    await test.step('Verify token display page', async () => {
      await expect(page).toHaveURL(/\/oauth\/token\/display/);
      await expect(page.locator('body')).toContainText('Display Token');
    });
  });

  test('should log the user out', async ({ page }) => {
    const masthead = new MastheadPage(page);
    await page.goto('/');

    const authDisabled = await masthead.isAuthDisabled();
    test.skip(authDisabled, 'Auth is disabled — skipping logout test');

    await masthead.openUserDropdown();
    await masthead.clickLogOut();
    await expect(page).not.toHaveURL('/');
  });
});
