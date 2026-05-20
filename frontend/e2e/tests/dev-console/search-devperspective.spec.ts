import { test } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { SearchPage } from '../../pages/dev-console/search-page';

test.describe('Search page', { tag: ['@smoke', '@dev-console'] }, () => {
  const namespace = `aut-search-enhancement-${Date.now()}`;
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

  test('recently searched section shows searched resource', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const searchPage = new SearchPage(page);

    await test.step('Set up dev perspective and namespace', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
    });

    await test.step('Search for AlertingRule', async () => {
      await perspectivePage.navigateToSearch();
      await searchPage.searchAndSelectResource('AlertingRule');
    });

    await test.step('Navigate away and return to Search', async () => {
      await perspectivePage.navigateToTopology();
      await perspectivePage.navigateToSearch();
    });

    await test.step('Verify AlertingRule in Recently used', async () => {
      await searchPage.openResourceFilter();
      await searchPage.expectRecentlyUsedToContain('AlertingRule');
    });
  });

  test(
    'five recently searched items appear in dropdown',
    { tag: ['@regression'] },
    async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const searchPage = new SearchPage(page);
      const resources = [
        'AlertingRule',
        'Deployment',
        'DeploymentConfig',
        'ConfigMap',
        'BuildConfig',
      ];

      await test.step('Set up dev perspective and namespace', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
      });

      await test.step('Search for 5 resources', async () => {
        for (const resource of resources) {
          await perspectivePage.navigateToSearch();
          await searchPage.searchAndSelectResource(resource);
          await perspectivePage.navigateToTopology();
        }
      });

      await test.step('Verify all 5 in Recently used', async () => {
        await perspectivePage.navigateToSearch();
        await searchPage.openResourceFilter();
        await searchPage.expectRecentlyUsedToContainAll(resources);
      });
    },
  );

  test(
    'clear history removes recently used section',
    { tag: ['@regression'] },
    async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const searchPage = new SearchPage(page);

      await test.step('Set up and search for a resource', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await perspectivePage.navigateToSearch();
        await searchPage.searchAndSelectResource('AlertingRule');
      });

      await test.step('Navigate away and return', async () => {
        await perspectivePage.navigateToTopology();
        await perspectivePage.navigateToSearch();
      });

      await test.step('Clear history and verify removal', async () => {
        await searchPage.openResourceFilter();
        await searchPage.clearHistory();
        await searchPage.expectRecentlyUsedNotVisible();
      });
    },
  );
});
