import { test, expect } from '../../../fixtures';
import { warmupSPA } from '../../../pages/base-page';
import { ProjectDashboardPage } from '../../../pages/project-dashboard-page';

const namespace = `test-project-dashboard-${Date.now()}`;

test.describe('Project Dashboard', { tag: ['@admin'] }, () => {
  let dashboard: ProjectDashboardPage;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(namespace);
  });

  test.beforeEach(async ({ page }) => {
    await warmupSPA(page);
    dashboard = new ProjectDashboardPage(page);
    await dashboard.navigateToProject(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test.describe('Details Card', () => {
    test('has all fields populated', async () => {
      await expect(dashboard.getDetailsCard()).toBeVisible();

      const expectedTitles = ['Name', 'Requester', 'Labels', 'Description'];
      await expect(dashboard.getDetailItemTitle()).toHaveCount(expectedTitles.length);
      for (let i = 0; i < expectedTitles.length; i++) {
        await expect(dashboard.getDetailItemTitle().nth(i)).toHaveText(expectedTitles[i]);
      }

      await expect(dashboard.getDetailItemValue()).toHaveCount(expectedTitles.length);
      await expect(dashboard.getDetailItemValue().nth(0)).toHaveText(namespace);
      await expect(dashboard.getDetailItemValue().nth(1)).not.toBeEmpty();
      await expect(dashboard.getDetailItemValue().nth(2)).toContainText(
        `kubernetes.io/metadata.name=${namespace}`,
      );
      await expect(dashboard.getDetailItemValue().nth(3)).toHaveText('No description');
    });

    test('has View all link that navigates to project details', async ({ page }) => {
      await dashboard.getViewAllLink().click();
      await expect(page).toHaveURL(new RegExp(`/k8s/cluster/projects/${namespace}/details`));
    });
  });

  test.describe('Status Card', () => {
    test('has health indicator showing Active', async () => {
      await expect(dashboard.getStatusCard()).toBeVisible();
      await expect(dashboard.getProjectStatus()).toHaveText('Active');
    });
  });

  test.describe('Inventory Card', () => {
    test('has all items', async () => {
      await expect(dashboard.getInventoryCard()).toBeVisible();

      const inventoryItems = [
        { kind: 'Deployment', path: `/k8s/ns/${namespace}/deployments` },
        { kind: 'DeploymentConfig', path: `/k8s/ns/${namespace}/deploymentconfigs` },
        { kind: 'StatefulSet', path: `/k8s/ns/${namespace}/statefulsets` },
        { kind: 'Pod', path: `/k8s/ns/${namespace}/pods` },
        {
          kind: 'PersistentVolumeClaim',
          path: `/k8s/ns/${namespace}/persistentvolumeclaims`,
        },
        { kind: 'Service', path: `/k8s/ns/${namespace}/services` },
        { kind: 'Route', path: `/k8s/ns/${namespace}/routes` },
        { kind: 'ConfigMap', path: `/k8s/ns/${namespace}/configmaps` },
        { kind: 'Secret', path: `/k8s/ns/${namespace}/secrets` },
        {
          kind: 'VolumeSnapshot',
          path: `/k8s/ns/${namespace}/snapshot.storage.k8s.io~v1~VolumeSnapshot`,
        },
      ];

      for (let i = 0; i < inventoryItems.length; i++) {
        await expect(dashboard.getResourceInventoryItem().nth(i)).toHaveText(
          new RegExp(`^\\d+ ${inventoryItems[i].kind}s?$`),
        );
        await expect(dashboard.getResourceInventoryItem().nth(i)).toHaveAttribute(
          'href',
          inventoryItems[i].path,
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

  test.describe('Launcher Card', () => {
    const consoleLinkName = `link-${namespace}`;

    test('is displayed when ConsoleLink CR exists', async ({ k8sClient, cleanup }) => {
      await test.step('Create ConsoleLink', async () => {
        await k8sClient.createClusterCustomResource(
          'console.openshift.io',
          'v1',
          'consolelinks',
          {
            apiVersion: 'console.openshift.io/v1',
            kind: 'ConsoleLink',
            metadata: { name: consoleLinkName },
            spec: {
              href: 'https://www.example.com/',
              location: 'NamespaceDashboard',
              namespaceDashboard: { namespaces: [namespace] },
              text: 'Namespace Dashboard Link',
            },
          },
        );
        cleanup.trackClusterCustomResource(
          consoleLinkName,
          'console.openshift.io',
          'v1',
          'consolelinks',
        );
      });

      await test.step('Verify launcher card', async () => {
        await dashboard.navigateToProject(namespace);
        await expect(dashboard.getLauncherCard()).toBeVisible();
        await expect(dashboard.getLauncherItem()).toContainText('Namespace Dashboard Link');
        await expect(dashboard.getLauncherItem()).toHaveAttribute(
          'href',
          'https://www.example.com/',
        );
      });
    });
  });

  test.describe('Resource Quotas Card', () => {
    const quotaName = 'example';

    test('shows Resource Quotas', async ({ k8sClient, cleanup }) => {
      await test.step('Create ResourceQuota', async () => {
        await k8sClient.createResourceQuota(quotaName, namespace, {
          hard: {
            pods: '4',
            'requests.cpu': '1',
            'requests.memory': '1Gi',
            'limits.cpu': '2',
          },
        });
        cleanup.track({
          name: quotaName,
          namespace,
          apiGroup: '',
          apiVersion: 'v1',
          plural: 'resourcequotas',
          type: 'ResourceQuota',
        });
      });

      await test.step('Verify resource quotas card', async () => {
        await dashboard.navigateToProject(namespace);
        await expect(dashboard.getResourceQuotasCard()).toBeVisible();
        await expect(dashboard.getResourceQuotaLink()).toHaveText(quotaName);
        await expect(dashboard.getResourceQuotaGaugeChart()).toHaveCount(4);
      });
    });
  });
});
