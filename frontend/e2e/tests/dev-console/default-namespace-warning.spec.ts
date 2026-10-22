import { test, expect } from '../../fixtures';
import { ImportFromGitPage } from '../../pages/dev-console/add-page';

const DEFAULT_NAMESPACE = 'default';

test.describe('Default namespace warning on the Import from Git form', () => {
  const userNamespace = `aut-default-ns-warning-${Date.now()}`;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(userNamespace);
    await k8sClient.waitForNamespaceReady(userNamespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(userNamespace);
  });

  test('warns below the submit button when the selected project is a default project', async ({
    page,
  }) => {
    const gitPage = new ImportFromGitPage(page);

    await gitPage.navigateToImportFromGit(DEFAULT_NAMESPACE);
    await expect(gitPage.getDefaultNamespaceDeploymentWarning()).toBeVisible({ timeout: 30_000 });
    await expect(gitPage.getProjectDropdownDefaultLabel()).toBeVisible();
  });

  test('shows no warning when the selected project is a user project', async ({ page }) => {
    const gitPage = new ImportFromGitPage(page);

    await gitPage.navigateToImportFromGit(userNamespace);
    await expect(gitPage.getProjectDropdownDefaultLabel()).toBeHidden();
    await expect(gitPage.getDefaultNamespaceDeploymentWarning()).toBeHidden();
  });
});
