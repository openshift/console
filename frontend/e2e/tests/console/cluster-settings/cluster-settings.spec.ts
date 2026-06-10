import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';
import { DetailsPage } from '../../../pages/details-page';

test.describe('Cluster Settings', { tag: ['@admin'] }, () => {
  test('displays page title, horizontal navigation tab headings and pages', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);

    await test.step('Navigate to Cluster Settings and verify page title', async () => {
      await clusterSettings.navigateToDetails();
      await expect(clusterSettings.getPageHeading()).toContainText('Cluster Settings');
    });

    await test.step('Verify Details tab is accessible', async () => {
      await clusterSettings.navigateToDetails();
    });

    await test.step('Verify ClusterOperators tab is accessible', async () => {
      await clusterSettings.navigateToClusterOperatorsTab();
    });

    await test.step('Verify Configuration tab is accessible', async () => {
      await clusterSettings.navigateToConfigurationTab();
    });
  });

  test('displays Cluster Operators page and console Operator details page', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);
    const details = new DetailsPage(page);

    await test.step('Navigate to ClusterOperators tab', async () => {
      await clusterSettings.navigateToDetails();
      await clusterSettings.navigateToClusterOperatorsTab();
    });

    await test.step('Click console operator row', async () => {
      await details.clickResourceRow('console');
    });

    await test.step('Verify console operator details page and YAML tab', async () => {
      await expect(details.getPageHeading()).toContainText('console');
      await details.selectTab('YAML');
    });
  });

  // eslint-disable-next-line playwright/expect-expect
  test('displays Configuration page and ClusterVersion configuration details page', async ({
    page,
  }) => {
    const clusterSettings = new ClusterSettingsPage(page);
    const details = new DetailsPage(page);

    await test.step('Navigate to Configuration tab', async () => {
      await clusterSettings.navigateToConfiguration();
      // Wait for configuration resources to load
      await expect(page.getByTestId('ClusterVersion')).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Click ClusterVersion and select YAML tab', async () => {
      // Click the ClusterVersion link directly
      const clusterVersionLink = page.getByTestId('ClusterVersion');
      await clusterVersionLink.click();

      await details.selectTab('YAML');
    });
  });

  test('displays Configuration page and ClusterVersion Edit ClusterVersion resource details page', async ({
    page,
  }) => {
    const clusterSettings = new ClusterSettingsPage(page);
    const details = new DetailsPage(page);

    await test.step('Navigate to Configuration tab', async () => {
      await clusterSettings.navigateToConfiguration();
    });

    await test.step('Open ClusterVersion kebab menu and click Edit', async () => {
      await details.openResourceKebabMenu('ClusterVersion');
      await details.clickKebabAction('Edit ClusterVersion resource');
    });

    await test.step('Verify Edit page loads with version title', async () => {
      await expect(details.getPageHeading()).toContainText('version');
    });
  });

  test('displays Configuration page and ClusterVersion Explore Console API details page', async ({
    page,
  }) => {
    const clusterSettings = new ClusterSettingsPage(page);
    const details = new DetailsPage(page);

    await test.step('Navigate to Configuration tab', async () => {
      await clusterSettings.navigateToConfiguration();
    });

    await test.step('Open ClusterVersion kebab menu and click Explore API', async () => {
      await details.openResourceKebabMenu('ClusterVersion');
      await details.clickKebabAction('Explore ClusterVersion API');
    });

    await test.step('Verify API Explorer page loads', async () => {
      await expect(details.getPageHeading()).toContainText('ClusterVersion');
    });
  });
});
