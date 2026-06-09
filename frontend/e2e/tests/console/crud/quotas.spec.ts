import yaml from 'js-yaml';

import { test, expect } from '../../../fixtures';
import { getEditorContent, setEditorContent } from '../../../pages/base-page';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { Navigation } from '../../../pages/navigation';

const testId = Date.now();
const quotaName = `test-resource-quota-${testId}`;
const clusterQuotaName = `test-cluster-resource-quota-${testId}`;

test.describe('Quotas', { tag: ['@admin'] }, () => {
  test.describe.configure({ mode: 'serial' });
  let namespace: string;

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `test-quotas-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteClusterCustomResource(
      'quota.openshift.io',
      'v1',
      'clusterresourcequotas',
      clusterQuotaName,
    );
    await k8sClient.deleteNamespace(namespace);
  });

  test('create ResourceQuota and ClusterResourceQuota via YAML editor', async ({ page }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);

    await test.step('Create ResourceQuota via YAML editor', async () => {
      await nav.navigateToAdministration('ResourceQuotas');
      await listPage.selectProject(namespace);
      await page.getByTestId('item-create').click();

      const content = await getEditorContent(page);
      const parsed = yaml.load(content) as Record<string, any>;
      parsed.metadata.name = quotaName;
      parsed.metadata.namespace = namespace;
      await setEditorContent(page, yaml.dump(parsed));

      await page.getByTestId('save-changes').click();
      await expect(page.getByTestId('yaml-error')).not.toBeAttached();

      const details = new DetailsPage(page);
      await details.waitForPageLoad();
    });

    await test.step('Navigate back to list', async () => {
      await new DetailsPage(page).getBreadcrumb(0).click();
    });

    await test.step('Create ClusterResourceQuota via YAML editor', async () => {
      await page.getByTestId('item-create').click();

      const crqYaml = {
        apiVersion: 'quota.openshift.io/v1',
        kind: 'ClusterResourceQuota',
        metadata: { name: clusterQuotaName },
        spec: {
          quota: { hard: { pods: '10', secrets: '10' } },
          selector: {
            labels: {
              matchLabels: { 'kubernetes.io/metadata.name': namespace },
            },
          },
        },
      };
      await setEditorContent(page, yaml.dump(crqYaml));

      await page.getByTestId('save-changes').click();
      await expect(page.getByTestId('yaml-error')).not.toBeAttached();

      const details = new DetailsPage(page);
      await details.waitForPageLoad();
    });
  });

  test('All Projects shows ResourceQuotas', async ({ page }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);

    await nav.navigateToAdministration('ResourceQuotas');
    await listPage.selectAllProjects();

    await listPage.filterByName(quotaName);
    await expect(listPage.getCell(quotaName)).toBeVisible();
  });

  test('All Projects shows ClusterResourceQuotas', async ({ page }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);
    const details = new DetailsPage(page);

    await nav.navigateToAdministration('ResourceQuotas');
    await listPage.selectAllProjects();

    await listPage.filterByName(clusterQuotaName);
    await expect(listPage.getCell(clusterQuotaName)).toBeVisible();

    await test.step('Verify breadcrumb', async () => {
      await listPage.clickRowByName(clusterQuotaName);
      await details.waitForPageLoad();
      await expect(details.getBreadcrumb(0)).toContainText('ClusterResourceQuota');
    });
  });

  test('project namespace shows ResourceQuotas', async ({ page }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);

    await nav.navigateToAdministration('ResourceQuotas');
    await listPage.selectProject(namespace);

    await listPage.filterByName(quotaName);
    await expect(listPage.getCell(quotaName)).toBeVisible();
  });

  test('project namespace shows AppliedClusterResourceQuotas', async ({ page }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);
    const details = new DetailsPage(page);

    await nav.navigateToAdministration('ResourceQuotas');
    await listPage.selectProject(namespace);

    await listPage.filterByName(clusterQuotaName);
    await expect(listPage.getCell(clusterQuotaName)).toBeVisible();

    await test.step('Verify breadcrumb', async () => {
      await listPage.clickRowByName(clusterQuotaName);
      await details.waitForPageLoad();
      await expect(details.getBreadcrumb(0)).toContainText('AppliedClusterResourceQuota');
    });
  });
});
