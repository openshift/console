import { test, expect } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { UserPreferencesPage } from '../../pages/dev-console/user-preferences-page';

test.describe('Manage user preferences', { tag: ['@dev-console'] }, () => {
  const namespace = `aut-user-preferences-${Date.now()}`;
  let k8s: KubernetesClient;

  test.beforeAll(async () => {
    k8s = new KubernetesClient({
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    });
    await k8s.createNamespace(namespace);
  });

  test.afterAll(async () => {
    await k8s.deleteNamespace(namespace);
  });

  test('visiting user preference page', { tag: ['@smoke'] }, async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const userPreferencesPage = new UserPreferencesPage(page);

    await test.step('Navigate to admin perspective', async () => {
      await page.goto('/');
      await perspectivePage.switchToAdministrator();
    });

    await test.step('Open user preferences', async () => {
      await userPreferencesPage.openUserPreferences();
    });

    await test.step('Verify tabs', async () => {
      await userPreferencesPage.expectTabVisible('General');
      await userPreferencesPage.expectTabVisible('Language');
    });
  });

  test(
    'setting developer preference for perspective',
    { tag: ['@regression'] },
    async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const userPreferencesPage = new UserPreferencesPage(page);

      await test.step('Navigate to admin perspective', async () => {
        await page.goto('/');
        await perspectivePage.switchToAdministrator();
      });

      await test.step('Set perspective preference to Developer', async () => {
        await userPreferencesPage.openUserPreferences();
        await userPreferencesPage.changePreferenceDropdown('Perspective', 'Developer');
      });

      await test.step('Reload and verify developer perspective', async () => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await userPreferencesPage.expectPerspective('Developer');
      });

      await test.step('Reset preference', async () => {
        await userPreferencesPage.openUserPreferences();
        await userPreferencesPage.changePreferenceDropdown('Perspective', 'Last viewed');
      });
    },
  );

  test('setting a preference for a project', { tag: ['@regression'] }, async () => {
    test.skip(true, 'Marked @broken-test in Cypress');
  });

  test('creating project with project preference', { tag: ['@regression'] }, async () => {
    test.skip(true, 'Marked @broken-test in Cypress');
  });

  test('setting graph preference for topology', { tag: ['@regression'] }, async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const userPreferencesPage = new UserPreferencesPage(page);

    await test.step('Create deployment workload', async () => {
      await k8s.appsV1Api.createNamespacedDeployment({
        namespace,
        body: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'node1', namespace },
          spec: {
            replicas: 1,
            selector: { matchLabels: { app: 'node1' } },
            template: {
              metadata: { labels: { app: 'node1' } },
              spec: {
                containers: [
                  {
                    name: 'node1',
                    image: 'registry.access.redhat.com/ubi8/nodejs-18:latest',
                    ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  },
                ],
              },
            },
          },
        },
      });
    });

    await test.step('Set topology preference to Graph', async () => {
      await page.goto('/');
      await perspectivePage.switchToAdministrator();
      await userPreferencesPage.openUserPreferences();
      await userPreferencesPage.changePreferenceDropdown('Topology', 'Graph');
    });

    await test.step('Reload and navigate to topology', async () => {
      await userPreferencesPage.reloadConsole();
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToTopology();
    });

    await test.step('Verify graph view', async () => {
      await userPreferencesPage.expectTopologyGraphView();
    });
  });

  test('setting list preference for topology', { tag: ['@regression'] }, async () => {
    test.skip(true, 'Marked @broken-test in Cypress — bugzilla 2014313');
  });

  test(
    'setting form preference for create/edit resource method',
    { tag: ['@regression'] },
    async () => {
      test.skip(true, 'Marked @broken-test in Cypress');
    },
  );

  test(
    'setting YAML preference for create/edit resource method',
    { tag: ['@regression'] },
    async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const userPreferencesPage = new UserPreferencesPage(page);

      await test.step('Set create/edit preference to YAML', async () => {
        await page.goto('/');
        await perspectivePage.switchToAdministrator();
        await userPreferencesPage.openUserPreferences();
        await userPreferencesPage.changePreferenceDropdown('Create/Edit resource method', 'YAML');
      });

      await test.step('Navigate to Helm charts and install', async () => {
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await perspectivePage.navigateToAdd();
        const helmCard = page.getByTestId('card helm');
        await helmCard.click();
        const searchInput = page.locator('[data-test="search-catalog"]');
        await searchInput.fill('Nodejs');
        const helmChartCard = page
          .locator('[data-test^="HelmChart"]')
          .filter({ hasText: 'Nodejs' })
          .first();
        await helmChartCard.click();
        const installButton = page.locator('[data-test="install-helm"]');
        await installButton.click();
      });

      await test.step('Verify YAML view selected', async () => {
        await userPreferencesPage.expectYamlViewSelected();
      });
    },
  );

  test('setting a preference for language', { tag: ['@regression'] }, async () => {
    test.skip(true, 'Marked @broken-test in Cypress');
  });

  test('setting routing options preference for import form', { tag: ['@regression'] }, async () => {
    test.skip(true, 'Marked @broken-test in Cypress — ODC-6303');
  });

  test('setting theme preference for console', { tag: ['@regression'] }, async () => {
    test.skip(true, 'Manual test — ODC-5990');
  });

  test(
    'setting resource type preference for console',
    { tag: ['@regression'] },
    async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const userPreferencesPage = new UserPreferencesPage(page);

      await test.step('Set resource type to DeploymentConfig', async () => {
        await page.goto('/');
        await perspectivePage.switchToAdministrator();
        await userPreferencesPage.openUserPreferences();
        await userPreferencesPage.clickTab('Applications');
        await userPreferencesPage.changePreferenceDropdown('Resource Type', 'DeploymentConfig');
      });

      await test.step('Navigate to Container images', async () => {
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await perspectivePage.navigateToAdd();
        const containerImageCard = page.getByTestId('card container-image');
        await containerImageCard.click();
      });

      await test.step('Verify DeploymentConfig is selected', async () => {
        const resourceDropdown = page.locator('[data-test-id="dropdown-button"]').filter({
          hasText: 'DeploymentConfig',
        });
        await expect(resourceDropdown.first()).toBeVisible({ timeout: 30_000 });
      });
    },
  );
});
