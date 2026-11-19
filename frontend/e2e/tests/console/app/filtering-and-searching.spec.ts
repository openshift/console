import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';

const SEARCH_NAMESPACE = 'openshift-authentication-operator';
const SEARCH_DEPLOYMENT_NAME = 'authentication-operator';

test.describe('Filtering and Searching', { tag: ['@admin'] }, () => {
  let ns: string;
  let workloadName: string;

  test.beforeAll(async ({ k8sClient }, workerInfo) => {
    ns = `test-filter-${workerInfo.workerIndex}-${Date.now()}`;
    workloadName = `filter-${ns.slice(-8)}`;

    await k8sClient.createNamespace(ns);
    await k8sClient.createDeployment(ns, {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: workloadName,
        labels: { 'lbl-filter': ns, app: 'name' },
      },
      spec: {
        replicas: 3,
        selector: { matchLabels: { app: 'name' } },
        template: {
          metadata: { labels: { app: 'name' } },
          spec: {
            securityContext: { runAsNonRoot: true, seccompProfile: { type: 'RuntimeDefault' } },
            containers: [
              {
                name: 'httpd',
                image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities: { drop: ['ALL'] },
                },
              },
            ],
          },
        },
      },
    });
    await k8sClient.waitForDeploymentReady(workloadName, ns);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(ns);
  });

  test('filters Pod from object detail', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto(`/k8s/ns/${ns}/deployments/${workloadName}/pods`);
    await listPage.waitForRows();
    await listPage.filterByName(workloadName);
    await expect(listPage.cells).toHaveCount(3, { timeout: 30_000 });
  });

  test('filters invalid Pod from object detail', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto(`/k8s/ns/${ns}/deployments/${workloadName}/pods`);
    await listPage.waitForRows();
    await listPage.filterByName('XYZ123');
    await expect(listPage.table.locator('.pf-v6-l-bullseye')).toContainText('No Pods found');
  });

  test('filters from Pods list', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto('/k8s/all-namespaces/pods');
    await listPage.waitForRows();
    await listPage.filterByName(workloadName);
    await expect(listPage.cells).toHaveCount(3, { timeout: 30_000 });
  });

  test('displays namespace column in Search for All Namespaces', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto(
      `/search/all-namespaces?kind=apps~v1~Deployment&page=1&perPage=50&name=${SEARCH_DEPLOYMENT_NAME}`,
    );
    await listPage.waitForRows();
    await expect(listPage.cells).toHaveCount(1);
    await expect(listPage.resourceLink(SEARCH_NAMESPACE)).toBeAttached();
  });

  test('hides namespace column in Search for scoped namespace', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto(
      `/search/ns/${SEARCH_NAMESPACE}?kind=apps~v1~Deployment&page=1&perPage=50&name=${SEARCH_DEPLOYMENT_NAME}`,
    );
    await listPage.waitForRows();
    await expect(listPage.cells).toHaveCount(1);
    await expect(listPage.resourceLink(SEARCH_NAMESPACE)).not.toBeAttached();
  });

  test('searches for object by kind and label', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto(`/search/ns/${ns}?kind=Deployment&q=lbl-filter%3D${ns}`);
    await listPage.waitForRows();
    await expect(listPage.cell(workloadName)).toBeAttached();
  });

  test('searches for object by kind, label, and name', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto(`/search/all-namespaces?kind=Pod&q=app%3Dname&name=${workloadName}`);
    await listPage.waitForRows();
    await expect(listPage.cells).toHaveCount(3, { timeout: 30_000 });
  });

  // The alertmanager configuration page is only served on standalone
  // clusters; the pod-search page renders everywhere.
  test(
    'hides filter category select on a text-only filter page',
    { tag: ['@standalone'] },
    async ({ page }) => {
      const listPage = new ListPage(page);
      await page.goto('/settings/cluster/alertmanagerconfig?page=1&perPage=50');
      await expect(listPage.table).toBeVisible({ timeout: 60_000 });
      await expect(listPage.filterGroupToggles).toHaveCount(1);
      await expect(listPage.filterGroupToggles).toBeHidden();
    },
  );

  test('hides filter category select on a select-only filter page', async ({ page }) => {
    const listPage = new ListPage(page);
    await page.goto('/search/all-namespaces?page=1&perPage=50&kind=core~v1~Pod');
    await listPage.waitForRows();
    await expect(listPage.filterGroupToggles).toHaveCount(2);
    await expect(listPage.filterGroupToggles.first()).toBeHidden();
  });
});
