import { test, expect } from '../../fixtures';
import { ModalPage } from '../../pages/modal-page';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';

test.describe('OpenShift Namespaces', { tag: ['@smoke', '@dev-console'] }, () => {
  test('create a namespace via the Create Project modal', async ({ page, cleanup }) => {
    const perspectivePage = new PerspectivePage(page);
    const modalPage = new ModalPage(page);
    const projectName = `aut-project-${Date.now()}-ns`;

    await test.step('Switch to developer perspective', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
    });

    await test.step('Open Create Project modal', async () => {
      await perspectivePage.selectOrCreateProject(projectName);
      cleanup.trackNamespace(projectName);
    });

    await test.step('Verify modal closes and project is created', async () => {
      await modalPage.shouldBeClosed();
      await expect(page.locator('[data-test-id="namespace-bar-dropdown"]')).toContainText(
        projectName,
      );
    });
  });
});
