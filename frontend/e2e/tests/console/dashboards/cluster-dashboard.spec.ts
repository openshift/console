import { test, expect } from '../../../fixtures';
import { ClusterDashboardPage } from '../../../pages/cluster-dashboard-page';

test.describe('Cluster Dashboard', { tag: ['@admin', '@smoke'] }, () => {
  let dashboard: ClusterDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new ClusterDashboardPage(page);
    await dashboard.navigateToDashboard();
  });

  test.describe('Details Card', () => {
    test('has all fields populated', async () => {
      await expect(dashboard.getDetailsCard()).toBeVisible();

      const expectedTitles = [
        'Cluster API address',
        'Cluster ID',
        'Infrastructure provider',
        'OpenShift version',
        'Service Level Agreement (SLA)',
        'Update channel',
      ];

      await expect(dashboard.getDetailItemTitle()).toHaveCount(expectedTitles.length);

      for (let i = 0; i < expectedTitles.length; i++) {
        await expect(dashboard.getDetailItemTitle().nth(i)).toHaveText(expectedTitles[i]);
      }

      await expect(dashboard.getDetailItemValue()).toHaveCount(expectedTitles.length);
      await expect(dashboard.getDetailItemValue().nth(0)).toContainText('https://');
      await expect(dashboard.getDetailItemValue().nth(1)).toContainText('-');
      await expect(dashboard.getDetailItemValue().nth(2)).not.toBeEmpty();
      await expect(dashboard.getDetailItemValue().nth(3)).toContainText('.');
      await expect(dashboard.getDetailItemValue().nth(4)).not.toBeEmpty();
      await expect(dashboard.getDetailItemValue().nth(5)).not.toBeEmpty();
    });

    test('has View settings link', async () => {
      await expect(dashboard.getViewSettingsLink()).toBeVisible();
      await expect(dashboard.getViewSettingsLink()).toHaveAttribute('href', '/settings/cluster/');
    });
  });

  test.describe('Status Card', () => {
    test('has View alerts link', async () => {
      await expect(dashboard.getViewAlertsLink()).toBeVisible();
      await expect(dashboard.getViewAlertsLink()).toHaveAttribute('href', '/monitoring/alerts');
    });

    test('has health indicators', async () => {
      await dashboard.waitForStatusCardLoaded();
      await expect(dashboard.getStatusCard()).toBeVisible();

      const expectedTitles = ['Cluster', 'Control Plane', 'Operators', 'Dynamic Plugins'];
      for (const title of expectedTitles) {
        await expect(dashboard.getStatusCard().getByTestId(title).first()).toContainText(title);
      }
    });
  });

  test.describe('Inventory Card', () => {
    test('has all items', async () => {
      await expect(dashboard.getInventoryCard()).toBeVisible();

      const inventoryItems = [
        { title: 'Node', link: '/k8s/cluster/nodes' },
        { title: 'Pod', link: '/k8s/all-namespaces/pods' },
        { title: 'StorageClass', link: '/k8s/cluster/storageclasses' },
        { title: 'PersistentVolumeClaim', link: '/k8s/all-namespaces/persistentvolumeclaims' },
      ];

      for (let i = 0; i < inventoryItems.length; i++) {
        await expect(dashboard.getResourceInventoryItem().nth(i)).toContainText(
          inventoryItems[i].title,
        );
        await expect(dashboard.getResourceInventoryItem().nth(i)).toHaveAttribute(
          'href',
          inventoryItems[i].link,
        );
      }
    });
  });

  test.describe('Utilization Card', () => {
    test('has all items', async () => {
      await expect(dashboard.getUtilizationCard()).toBeVisible();

      const utilizationItems = ['CPU', 'Memory', 'Filesystem', 'Network transfer', 'Pod count'];
      await expect(dashboard.getUtilizationItem()).toHaveCount(utilizationItems.length);

      for (let i = 0; i < utilizationItems.length; i++) {
        await expect(dashboard.getUtilizationItemTitle().nth(i)).toHaveText(utilizationItems[i]);
      }
    });

    test('has duration dropdown defaulting to 1 hour', async () => {
      await expect(dashboard.getDurationSelect()).toContainText('1 hour');
    });
  });
});
