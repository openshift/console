import { browser, ExpectedConditions as until } from 'protractor';
import * as dashboardView from '@console/shared/src/test-views/dashboard-shared.view';
import {
  createResource,
  addLeakableResource,
  removeLeakedResources,
} from '@console/shared/src/test-utils/utils';
import { testName } from '../../protractor.conf';
import * as sideNavView from '../../views/sidenav.view';
import * as crudView from '../../views/crud.view';
import { horizontalTabFor, clickHorizontalTab } from '../../views/horizontal-nav.view';
import * as projectDashboardView from '../../views/dashboard.view';

const inventoryItems = [
  { title: 'Deployment', link: `/k8s/ns/${testName}/deployments` },
  { title: 'Pod', link: `/k8s/ns/${testName}/pods` },
  { title: 'PVC', link: `/k8s/ns/${testName}/persistentvolumeclaims` },
  { title: 'Service', link: `/k8s/ns/${testName}/services` },
  { title: 'Route', link: `/k8s/ns/${testName}/routes` },
  { title: 'Config Map', link: `/k8s/ns/${testName}/configmaps` },
  { title: 'Secret', link: `/k8s/ns/${testName}/secrets` },
];

const utilizationItems = ['CPU', 'Memory', 'Filesystem', 'Network Transfer', 'Pod count'];

const launcherLink = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsoleLink',
  metadata: {
    name: `link-${testName}`,
  },
  spec: {
    href: 'https://www.example.com/',
    location: 'NamespaceDashboard',
    namespaceDashboard: {
      namespaces: [testName],
    },
    text: 'Namespace Dashboard Link',
  },
};

const resourceQuota = {
  apiVersion: 'v1',
  kind: 'ResourceQuota',
  metadata: {
    name: 'example',
    namespace: testName,
  },
  spec: {
    hard: {
      pods: '4',
      'requests.cpu': '1',
      'requests.memory': '1Gi',
      'limits.cpu': '2',
      'limits.memory': '2Gi',
    },
  },
};

describe('Project Dashboard', () => {
  beforeAll(async () => {
    await sideNavView.clickNavLink(['Home', 'Projects']);
    await crudView.isLoaded();
    await crudView.resourceRowsPresent();
    // Filter by resource name to make sure the resource is on the first page of results.
    // Otherwise the tests fail since we do virtual scrolling and the element isn't found.
    await crudView.filterForName(testName);
    expect(crudView.rowForName(testName).isPresent()).toBe(true);
    await crudView
      .rowForName(testName)
      .$('a')
      .click();
    await dashboardView.isLoaded();
  });

  afterEach(async () => {
    await clickHorizontalTab('Overview');
    await dashboardView.isLoaded();
  });

  it('Dashboard is default details page', async () => {
    const tab = await horizontalTabFor('Overview');
    expect(tab.getAttribute('class')).toContain('co-m-horizontal-nav-item--active');
  });

  describe('Details Card', () => {
    it('has all fields populated', async () => {
      expect(projectDashboardView.detailsCard.isDisplayed()).toBe(true);
      const items = projectDashboardView.detailsCardList.$$('dt');
      const values = projectDashboardView.detailsCardList.$$('dd');

      expect(items.count()).toBe(3);
      expect(values.count()).toBe(3);
      expect(items.get(0).getText()).toEqual('Name');
      expect(values.get(0).getText()).toEqual(testName);
      expect(items.get(1).getText()).toEqual('Requester');
      expect(values.get(1).getText()).toEqual('kube:admin');
      expect(items.get(2).getText()).toEqual('Labels');
      expect(values.get(2).getText()).toEqual('No labels');
    });
    it('has View all link', async () => {
      const link = projectDashboardView.detailsCard.$(
        `[href="/k8s/cluster/projects/${testName}/details"]`,
      );
      expect(link.isDisplayed()).toBe(true);
      expect(link.getText()).toEqual('View all');
      await link.click();
      const tab = await horizontalTabFor('Details');
      expect(tab.getAttribute('class')).toContain('co-m-horizontal-nav-item--active');
    });
  });

  describe('Status Card', () => {
    it('has health indicator', async () => {
      expect(projectDashboardView.statusCard.isDisplayed()).toBe(true);
      const health = await projectDashboardView.statusCard.$('.co-icon-and-text');
      expect(health.isDisplayed()).toBe(true);
      expect(health.getText()).toEqual('Active');
    });
  });

  describe('Inventory Card', () => {
    it('has all items', async () => {
      expect(projectDashboardView.inventoryCard.isDisplayed()).toBe(true);
      inventoryItems.forEach((item) => {
        const link = projectDashboardView.inventoryCard.$(`[href="${item.link}"]`);
        expect(link.isDisplayed()).toBe(true);
        expect(link.getText()).toMatch(`^[0-9]* ${item.title}?.*`);
      });
    });
  });

  describe('Utilization Card', () => {
    it('has all items', () => {
      expect(projectDashboardView.utilizationCard.isDisplayed()).toBe(true);
      const items = projectDashboardView.utilizationItems;
      expect(items.count()).toBe(utilizationItems.length);
      utilizationItems.forEach((item, index) =>
        expect(
          items
            .get(index)
            .$('h4')
            .getText(),
        ).toEqual(item),
      );
    });
    it('has duration dropdown', () => {
      expect(projectDashboardView.durationDropdown.isDisplayed()).toBe(true);
      expect(projectDashboardView.durationDropdown.getText()).toEqual('1 Hour');
    });
  });

  describe('Activity Card', () => {
    it('has View events link', () => {
      expect(projectDashboardView.activityCard.isDisplayed()).toBe(true);
      const link = projectDashboardView.activityCard.$(`[href="/k8s/ns/${testName}/events"]`);
      expect(link.isDisplayed()).toBe(true);
      expect(link.getText()).toEqual('View events');
    });
    it('has Pause events button', async () => {
      const button = projectDashboardView.eventsPauseButton;
      expect(button.isDisplayed()).toBe(true);
      expect(await button.getText()).toEqual('Pause');
      await button.click();
      expect(button.getText()).toEqual('Resume');
    });
  });

  describe('Launcher Card', () => {
    const leakedResources = new Set<string>();

    afterAll(() => {
      removeLeakedResources(leakedResources);
    });

    it('is displayed when CR exists', async () => {
      const isLauncherCardPresent = await projectDashboardView.launcherCard.isPresent();
      expect(isLauncherCardPresent).toBe(false);
      createResource(launcherLink);
      addLeakableResource(leakedResources, launcherLink);
      await browser.wait(until.visibilityOf(projectDashboardView.launcherCard));
      const link = await projectDashboardView.launcherCard.$('a');
      expect(link.getText()).toEqual(launcherLink.spec.text);
      expect(link.getAttribute('href')).toEqual(launcherLink.spec.href);
    });
  });

  describe('Resource Quotas Card', () => {
    const leakedResources = new Set<string>();

    afterAll(() => {
      removeLeakedResources(leakedResources);
    });

    it('shows Resource Quotas', async () => {
      expect(projectDashboardView.resourceQuotasCard.isDisplayed()).toBe(true);
      expect(
        await projectDashboardView.resourceQuotasCard.$('.co-dashboard-card__body').getText(),
      ).toEqual('No resource quotas');
      createResource(resourceQuota);
      addLeakableResource(leakedResources, resourceQuota);

      await browser.wait(
        until.presenceOf(projectDashboardView.resourceQuotasCard.$('.co-resource-item')),
      );
      expect(
        projectDashboardView.resourceQuotasCard
          .$('.co-resource-item')
          .$('a')
          .getText(),
      ).toEqual(resourceQuota.metadata.name);
      expect(
        projectDashboardView.resourceQuotasCard.$('.co-resource-quota-chart-row').isDisplayed(),
      ).toBe(true);
    });
  });
});
