import { test, expect } from '../../fixtures';
import { HelmPage } from '../../pages/helm-page';
import { HelmRepositoryPage } from '../../pages/helm-repository-page';

test.describe('Helm Repositories', { tag: ['@helm', '@regression'] }, () => {
  test('shows Helm page tabs and Create dropdown options (HR-09-TC01, TC02, TC03)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-tabs-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Verify Helm Releases and Repositories tabs (HR-09-TC01)', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await expect(helmPage.getHelmReleasesTab()).toBeVisible({ timeout: 30_000 });
      await expect(helmPage.getRepositoriesTab()).toBeVisible();
    });

    await test.step('Navigate to Repositories tab and verify content (HR-09-TC02)', async () => {
      await helmPage.clickRepositoriesTab();
      await expect(page).toHaveURL(/\/repositories/);
    });

    await test.step('Verify Create dropdown options (HR-09-TC03)', async () => {
      await helmPage.clickCreateDropdown();
      await expect(helmPage.getCreateDropdownItem('helmRelease')).toBeVisible();
      await expect(helmPage.getCreateDropdownItem('projectHelmChartRepository')).toBeVisible();
      await expect(helmPage.getCreateDropdownItem('helmChartInstallation')).toBeVisible();
      await page.keyboard.press('Escape');
    });
  });

  test('creates and edits ProjectHelmChartRepository (HR-09-TC04, TC05)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-phcr-${Date.now()}`;
    const repoName = `test-phcr-${Date.now()}`;
    const repoUrl = 'https://charts.example.com/index.yaml';
    const updatedDisplayName = 'Updated PHCR Display Name';

    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);
    cleanup.trackCustomResource(
      repoName,
      ns,
      'helm.openshift.io',
      'v1beta1',
      'projecthelmchartrepositories',
    );

    const helmPage = new HelmPage(page);
    const repoPage = new HelmRepositoryPage(page);

    await test.step('Create ProjectHelmChartRepository (HR-09-TC04)', async () => {
      await repoPage.navigateToCreateForm(ns);
      await expect(repoPage.getScopeProjectRadio()).toBeVisible({ timeout: 30_000 });
      await repoPage.fillName(repoName);
      await repoPage.fillDisplayName('Test PHCR');
      await repoPage.fillDescription('A test project-scoped Helm chart repository');
      await repoPage.fillUrl(repoUrl);
      await repoPage.clickCreate();
    });

    await test.step('Verify repository appears in list', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.clickRepositoriesTab();
      await expect(repoPage.getRepositoryRow(repoName)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Edit ProjectHelmChartRepository display name (HR-09-TC05)', async () => {
      await repoPage.clickKebabForRepository(repoName);
      await repoPage.clickEditAction('ProjectHelmChartRepository');
      await repoPage.fillDisplayName(updatedDisplayName);
      await repoPage.clickSave();
    });
  });

  test('creates and edits HelmChartRepository (HR-09-TC06, TC07)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-hcr-${Date.now()}`;
    const repoName = `test-hcr-${Date.now()}`;
    const repoUrl = 'https://charts.example.com/index.yaml';
    const updatedUrl = 'https://updated-charts.example.com/index.yaml';

    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);
    cleanup.trackClusterCustomResource(
      repoName,
      'helm.openshift.io',
      'v1beta1',
      'helmchartrepositories',
    );

    const helmPage = new HelmPage(page);
    const repoPage = new HelmRepositoryPage(page);

    await test.step('Create HelmChartRepository (HR-09-TC06)', async () => {
      await repoPage.navigateToCreateForm(ns);
      await expect(repoPage.getScopeProjectRadio()).toBeVisible({ timeout: 30_000 });
      await repoPage.selectClusterScope();
      await repoPage.fillName(repoName);
      await repoPage.fillDisplayName('Test HCR');
      await repoPage.fillDescription('A test cluster-scoped Helm chart repository');
      await repoPage.fillUrl(repoUrl);
      await repoPage.clickCreate();
    });

    await test.step('Verify repository appears in list', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.clickRepositoriesTab();
      await expect(repoPage.getRepositoryRow(repoName)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Edit HelmChartRepository URL (HR-09-TC07)', async () => {
      await repoPage.clickKebabForRepository(repoName);
      await repoPage.clickEditAction('HelmChartRepository');
      await repoPage.fillUrl(updatedUrl);
      await repoPage.clickSave();
    });
  });

  test('namespace-scoped repo charts are visible only in their namespace (HR-06-TC12)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-scope-${Date.now()}`;
    const otherNs = `aut-helm-scope-other-${Date.now()}`;
    const repoName = `test-scoped-repo-${Date.now()}`;
    const repoDisplayName = 'Scoped Test Repo';

    await k8sClient.createNamespace(ns);
    await k8sClient.createNamespace(otherNs);
    cleanup.trackNamespace(ns);
    cleanup.trackNamespace(otherNs);
    cleanup.trackCustomResource(
      repoName,
      ns,
      'helm.openshift.io',
      'v1beta1',
      'projecthelmchartrepositories',
    );

    const repoPage = new HelmRepositoryPage(page);

    await test.step('Create ProjectHelmChartRepository in first namespace', async () => {
      await repoPage.navigateToCreateForm(ns);
      await expect(repoPage.getScopeProjectRadio()).toBeVisible({ timeout: 30_000 });
      await repoPage.fillName(repoName);
      await repoPage.fillDisplayName(repoDisplayName);
      await repoPage.fillUrl('https://charts.example.com/index.yaml');
      await repoPage.clickCreate();
    });

    await test.step('Verify repo visible in Repositories tab in its namespace', async () => {
      const helmPage = new HelmPage(page);
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.clickRepositoriesTab();
      await expect(repoPage.getRepositoryRow(repoName)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Verify repo NOT visible in a different namespace', async () => {
      const helmPage = new HelmPage(page);
      await helmPage.navigateToHelmReleases(otherNs);
      await helmPage.clickRepositoriesTab();
      await expect(repoPage.getRepositoryRow(repoName)).toBeHidden({ timeout: 10_000 });
    });
  });
});
