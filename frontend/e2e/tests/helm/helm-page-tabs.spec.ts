import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { HelmPage } from '../../pages/helm-page';
import { TopologyPage } from '../../pages/topology-page';

test.describe('Helm page tabs', { tag: ['@helm'] }, () => {
  test(
    'HR-09-TC01: Helm page displays Releases and Repositories tabs with empty state',
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-helm-tabs-${Date.now()}`;
      const helmPage = new HelmPage(page);

      await test.step('Set up namespace and navigate to Helm page', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
        await warmupSPA(page);
        await helmPage.switchPerspective('Developer');
        await helmPage.navigateToHelmPage(ns);
      });

      await test.step('Verify Helm Releases and Repositories tabs are visible', async () => {
        await expect(helmPage.getHelmReleasesTab()).toBeVisible();
        await expect(helmPage.getRepositoriesTab()).toBeVisible();
      });

      await test.step('Verify empty state message and catalog link', async () => {
        await expect(page.locator('h3')).toContainText('No Helm Releases found');
        await expect(helmPage.getCatalogLink()).toBeVisible();
      });

      await test.step('Verify Create dropdown with Helm Release and Repository options', async () => {
        await expect(helmPage.getCreateDropdownToggle()).toBeVisible();
        await helmPage.openCreateDropdown();
        await helmPage.verifyCreateDropdownItems();
        // Close dropdown by pressing Escape
        await page.keyboard.press('Escape');
      });
    },
  );

  test(
    'HR-09-TC02: Repositories tab navigation and breadcrumbs',
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-helm-repo-nav-${Date.now()}`;
      const helmPage = new HelmPage(page);

      await test.step('Set up namespace and navigate to Helm page', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
        await warmupSPA(page);
        await helmPage.switchPerspective('Developer');
        await helmPage.navigateToHelmPage(ns);
      });

      await test.step('Click Repositories tab and verify', async () => {
        await helmPage.clickRepositoriesTab();
        await expect(helmPage.getPageHeading()).toContainText('Helm');
      });

      await test.step('Click openshift-helm-charts repository and verify breadcrumbs', async () => {
        await helmPage.clickRepository('openshift-helm-charts');
        await expect(helmPage.getBreadcrumb(0)).toContainText('Repositories');
      });

      await test.step('Click Repositories breadcrumb and verify redirection', async () => {
        await helmPage.clickBreadcrumb(0);
        await expect(helmPage.getPageHeading()).toContainText('Helm');
        const isActive = await helmPage.isRepositoryTabActive();
        expect(isActive).toBe(true);
      });
    },
  );

  test(
    'HR-09-TC03: Create Helm Release from Helm page',
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-helm-create-${Date.now()}`;
      const releaseName = 'nodejs-release-2';
      const helmPage = new HelmPage(page);
      const topologyPage = new TopologyPage(page);

      await test.step('Set up namespace and navigate to Helm page', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
        await warmupSPA(page);
        await helmPage.switchPerspective('Developer');
        await helmPage.navigateToHelmPage(ns);
      });

      await test.step('Click Helm Release in Create dropdown', async () => {
        await helmPage.clickCreateHelmRelease();
        await expect(page).toHaveURL(/catalogType=HelmChart/);
      });

      await test.step('Search and select Nodejs chart from catalog', async () => {
        await helmPage.searchCatalogAndSelectChart('Nodejs');
      });

      await test.step('Fill release name and create', async () => {
        await expect(helmPage.getFormTitle()).toContainText('Create Helm Release', {
          timeout: 30_000,
        });
        await helmPage.fillReleaseName(releaseName);
        await helmPage.clickCreate();
      });

      await test.step('Verify workload in Topology', async () => {
        await topologyPage.verifyWorkloadVisible(releaseName, 120_000);
      });
    },
  );

  test(
    'HR-09-TC04: Create Project Helm Chart Repository',
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-helm-phcr-${Date.now()}`;
      const repoName = 'helm-test1';
      const helmPage = new HelmPage(page);

      await test.step('Set up namespace and navigate to Helm page', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
        await warmupSPA(page);
        await helmPage.switchPerspective('Developer');
        await helmPage.navigateToHelmPage(ns);
      });

      await test.step('Click Repository in Create dropdown and verify form', async () => {
        await helmPage.clickCreateRepository();
        await expect(helmPage.getFormTitle()).toContainText('Create Helm Chart Repository');
      });

      await test.step('Fill in the repository form', async () => {
        await helmPage.fillRepoName(repoName);
        await helmPage.fillRepoDescription('test');
        await helmPage.fillRepoUrl(
          'https://raw.githubusercontent.com/IBM/charts/master/repo/community/index.yaml',
        );
      });

      await test.step('Create and verify details page', async () => {
        await helmPage.clickSubmit();
        await expect(helmPage.getKindTitle('ProjectHelmChartRepository')).toBeVisible({
          timeout: 30_000,
        });
        await expect(helmPage.getDetailsPageHeading()).toContainText(repoName);
      });

      await test.step('Clean up: delete the repository', async () => {
        cleanup.trackCustomResource(
          repoName,
          ns,
          'helm.openshift.io',
          'v1beta1',
          'projecthelmchartrepositories',
          'ProjectHelmChartRepository',
        );
      });
    },
  );

  test(
    'HR-09-TC05: Edit Project Helm Chart Repository',
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-helm-edit-phcr-${Date.now()}`;
      const repoName = 'helm-test1';
      const helmPage = new HelmPage(page);

      await test.step('Set up namespace and create ProjectHelmChartRepository', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
        await k8sClient.createCustomResource(
          'helm.openshift.io',
          'v1beta1',
          ns,
          'projecthelmchartrepositories',
          {
            apiVersion: 'helm.openshift.io/v1beta1',
            kind: 'ProjectHelmChartRepository',
            metadata: { name: repoName, namespace: ns },
            spec: {
              name: repoName,
              connectionConfig: {
                url: 'https://raw.githubusercontent.com/IBM/charts/master/repo/community/index.yaml',
              },
              description: 'test',
            },
          },
        );
        cleanup.trackCustomResource(
          repoName,
          ns,
          'helm.openshift.io',
          'v1beta1',
          'projecthelmchartrepositories',
          'ProjectHelmChartRepository',
        );
      });

      await test.step('Navigate to Helm Repositories tab', async () => {
        await warmupSPA(page);
        await helmPage.switchPerspective('Developer');
        await helmPage.navigateToHelmRepositories(ns);
      });

      await test.step('Edit the repository', async () => {
        await helmPage.editRepository(repoName, 'ProjectHelmChartRepository');
        await expect(helmPage.getFormTitle()).toContainText('Edit ProjectHelmChartRepository');
      });

      await test.step('Update display name and save', async () => {
        await helmPage.fillRepoDisplayName('My charts');
        await helmPage.clickSubmit();
        await expect(helmPage.getKindTitle('ProjectHelmChartRepository')).toBeVisible({
          timeout: 30_000,
        });
        await expect(helmPage.getDetailsPageHeading()).toContainText(repoName);
      });

      await test.step('Navigate back and verify update in list', async () => {
        await helmPage.navigateToHelmRepositories(ns);
        await helmPage.filterRepoByName(repoName);
        await expect(helmPage.getResourceRows().first()).toContainText('My charts');
      });
    },
  );

  test(
    'HR-09-TC06: Create cluster-scoped Helm Chart Repository',
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-helm-hcr-${Date.now()}`;
      const repoName = 'helm-test2';
      const helmPage = new HelmPage(page);

      await test.step('Set up namespace and navigate to Helm page', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
        await warmupSPA(page);
        await helmPage.switchPerspective('Developer');
        await helmPage.navigateToHelmPage(ns);
      });

      await test.step('Click Repository in Create dropdown and verify form', async () => {
        await helmPage.clickCreateRepository();
        await expect(helmPage.getFormTitle()).toContainText('Create Helm Chart Repository');
      });

      await test.step('Select cluster scope and fill form', async () => {
        await helmPage.selectClusterScope();
        await helmPage.fillRepoName(repoName);
        await helmPage.fillRepoUrl(
          'https://raw.githubusercontent.com/Azure-Samples/helm-charts/master',
        );
      });

      await test.step('Create and verify details page', async () => {
        await helmPage.clickSubmit();
        await expect(helmPage.getKindTitle('HelmChartRepository')).toBeVisible({
          timeout: 30_000,
        });
        await expect(helmPage.getDetailsPageHeading()).toContainText(repoName);
      });

      await test.step('Track cluster resource for cleanup', async () => {
        cleanup.trackClusterCustomResource(
          repoName,
          'helm.openshift.io',
          'v1beta1',
          'helmchartrepositories',
          'HelmChartRepository',
        );
      });
    },
  );

  test(
    'HR-09-TC07: Edit cluster-scoped Helm Chart Repository',
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-helm-edit-hcr-${Date.now()}`;
      const repoName = 'helm-test2';
      const updatedUrl =
        'https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docs/index.yaml';
      const helmPage = new HelmPage(page);

      await test.step('Set up namespace and create HelmChartRepository', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
        await k8sClient.createClusterCustomResource(
          'helm.openshift.io',
          'v1beta1',
          'helmchartrepositories',
          {
            apiVersion: 'helm.openshift.io/v1beta1',
            kind: 'HelmChartRepository',
            metadata: { name: repoName },
            spec: {
              name: repoName,
              connectionConfig: {
                url: 'https://raw.githubusercontent.com/Azure-Samples/helm-charts/master',
              },
            },
          },
        );
        cleanup.trackClusterCustomResource(
          repoName,
          'helm.openshift.io',
          'v1beta1',
          'helmchartrepositories',
          'HelmChartRepository',
        );
      });

      await test.step('Navigate to Helm Repositories tab', async () => {
        await warmupSPA(page);
        await helmPage.switchPerspective('Developer');
        await helmPage.navigateToHelmRepositories(ns);
      });

      await test.step('Edit the repository', async () => {
        await helmPage.editRepository(repoName, 'HelmChartRepository');
        await expect(helmPage.getFormTitle()).toContainText('Edit HelmChartRepository');
      });

      await test.step('Update URL and save', async () => {
        await helmPage.fillRepoUrl(updatedUrl);
        await helmPage.clickSubmit();
        await expect(helmPage.getKindTitle('HelmChartRepository')).toBeVisible({
          timeout: 30_000,
        });
        await expect(helmPage.getDetailsPageHeading()).toContainText(repoName);
      });

      await test.step('Navigate back and verify update in list', async () => {
        await helmPage.navigateToHelmRepositories(ns);
        await helmPage.filterRepoByName(repoName);
        await expect(helmPage.getResourceRows().first()).toContainText(updatedUrl);
      });
    },
  );
});
