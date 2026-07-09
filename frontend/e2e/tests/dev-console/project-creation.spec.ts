import { test, expect } from '../../fixtures';
import { ListPage } from '../../pages/list-page';

test.describe('Project creation', { tag: ['@dev-console', '@smoke'] }, () => {
  test('creates a project from the Projects dropdown', async ({ page, cleanup }) => {
    const projectName = `aut-project-${Date.now()}`;
    const listPage = new ListPage(page);
    cleanup.trackNamespace(projectName);

    await test.step('Navigate to pods list and open dropdown', async () => {
      await page.goto('/k8s/all-namespaces/pods');
      await expect(listPage.getNamespaceDropdown()).toBeVisible({ timeout: 30_000 });
      await listPage.getNamespaceDropdown().getByRole('button').click();
    });

    await test.step('Create project', async () => {
      await listPage.createProject(projectName);
    });

    await test.step('Verify project created', async () => {
      await expect(listPage.getNamespaceDropdown()).toContainText(projectName, {
        timeout: 30_000,
      });
    });
  });
});
