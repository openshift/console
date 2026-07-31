import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { SearchPage } from '../../pages/dev-console/search-page';

test.describe('Search page - Recently used', { tag: ['@dev-console', '@smoke'] }, () => {
  test('shows recently searched resource in dropdown', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-search-recent-${Date.now()}`;
    const searchPage = new SearchPage(page);

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Search for AlertingRule and navigate away', async () => {
      await warmupSPA(page);
      await searchPage.switchPerspective('Developer');
      await searchPage.navigateToSearch(ns);
      await searchPage.searchAndSelectResource('AlertingRule');
      await searchPage.navigateToTopology(ns);
    });

    await test.step('Verify AlertingRule in recently used', async () => {
      await searchPage.navigateToSearch(ns);
      await searchPage.openResourcesFilter();
      await expect(searchPage.getRecentlyUsedItem('AlertingRule')).toBeVisible();
    });
  });

  test('shows up to 5 recently searched items', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-search-five-${Date.now()}`;
    const searchPage = new SearchPage(page);
    const resources = [
      'AlertingRule',
      'Deployment',
      'DeploymentConfig',
      'ConfigMap',
      'BuildConfig',
    ];

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Search for 5 resources', async () => {
      await warmupSPA(page);
      await searchPage.switchPerspective('Developer');
      for (const resource of resources) {
        await searchPage.navigateToSearch(ns);
        await searchPage.searchAndSelectResource(resource);
        await searchPage.navigateToTopology(ns);
      }
    });

    await test.step('Verify all 5 in recently used', async () => {
      await searchPage.navigateToSearch(ns);
      await searchPage.openResourcesFilter();
      for (const resource of resources) {
        await expect(searchPage.getRecentlyUsedItem(resource)).toBeVisible();
      }
    });
  });

  test('clears recently searched history', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-search-clear-${Date.now()}`;
    const searchPage = new SearchPage(page);

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Search and clear history', async () => {
      await warmupSPA(page);
      await searchPage.switchPerspective('Developer');
      await searchPage.navigateToSearch(ns);
      await searchPage.searchAndSelectResource('AlertingRule');
      await searchPage.navigateToTopology(ns);
      await searchPage.navigateToSearch(ns);
      await searchPage.openResourcesFilter();
      await searchPage.clearHistory();
    });

    await test.step('Verify history cleared', async () => {
      await searchPage.openResourcesFilter();
      await expect(searchPage.getRecentlyUsedHeading()).not.toBeAttached();
    });
  });
});
