import * as dashboardView from '@console/shared/src/test-views/dashboard-shared.view';
import * as clusterDashboardView from '../../views/dashboard.view';
import * as sideNavView from '../../views/sidenav.view';

const inventoryItems = [
  { title: 'Node', link: '/k8s/cluster/nodes' },
  { title: 'Pod', link: '/k8s/all-namespaces/pods' },
  { title: 'Storage Class', link: '/k8s/cluster/storageclasses' },
  { title: 'PVC', link: '/k8s/all-namespaces/persistentvolumeclaims' },
];

const utilizationItems = ['CPU', 'Memory', 'Filesystem', 'Network transfer', 'Pod count'];

describe('Cluster Dashboard', () => {
  beforeAll(async () => {
    await sideNavView.clickNavLink(['Home', 'Overview']);
    await dashboardView.isLoaded();
  });

  describe('Details Card', () => {
    it('has all fields populated', async () => {
      expect(clusterDashboardView.detailsCard.isDisplayed()).toBe(true);
      const expectedItems = [
        'Cluster API address',
        'Cluster ID',
        'Provider',
        'OpenShift version',
        'Update channel',
      ];
      const items = clusterDashboardView.detailsCardList.$$('dt');
      const values = clusterDashboardView.detailsCardList.$$('dd');
      expect(items.count()).toBe(expectedItems.length);
      expect(values.count()).toBe(expectedItems.length);
      expectedItems.forEach((label: string, i: number) => {
        expect(items.get(i).getText()).toBe(label);
        const text = values.get(i).getText();
        expect(text.length).not.toBe(0);
        // `Update Channel` is expected to be `Not available` in CI.
        if (label !== 'Update Channel') {
          expect(text).not.toBe('Not available');
        }
      });
    });
    it('has View settings link', () => {
      const link = clusterDashboardView.detailsCard.$('[href="/settings/cluster/"]');
      expect(link.isDisplayed()).toBe(true);
      expect(link.getText()).toEqual('View settings');
    });
  });

  describe('Status Card', () => {
    it('has View alerts link', () => {
      expect(clusterDashboardView.statusCard.isDisplayed()).toBe(true);
      const link = clusterDashboardView.statusCard.$('[href="/monitoring/alerts"]');
      expect(link.isDisplayed()).toBe(true);
      expect(link.getText()).toEqual('View alerts');
    });
    it('has health indicators', () => {
      const items = clusterDashboardView.statusCard.$$('.co-status-card__health-item');
      expect(items.get(0).getText()).toEqual('Cluster');
      expect(items.get(1).getText()).toMatch('Control Plane.*');
      expect(items.get(2).getText()).toMatch('Operators.*');
    });
  });

  describe('Inventory Card', () => {
    it('has all items', async () => {
      expect(clusterDashboardView.inventoryCard.isDisplayed()).toBe(true);
      inventoryItems.forEach((item) => {
        const link = clusterDashboardView.inventoryCard.$(`[href="${item.link}"]`);
        expect(link.isDisplayed()).toBe(true);
        expect(link.getText()).toMatch(`^[0-9]* ${item.title}?.*`);
      });
    });
  });

  describe('Utilization Card', () => {
    it('has all items', () => {
      expect(clusterDashboardView.utilizationCard.isDisplayed()).toBe(true);
      const items = clusterDashboardView.utilizationItems;
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
      expect(clusterDashboardView.durationDropdown.isDisplayed()).toBe(true);
      expect(clusterDashboardView.durationDropdown.getText()).toEqual('1 hour');
    });
  });

  describe('Activity Card', () => {
    it('has View events link', () => {
      expect(clusterDashboardView.activityCard.isDisplayed()).toBe(true);
      const link = clusterDashboardView.activityCard.$('[href="/k8s/all-namespaces/events"]');
      expect(link.isDisplayed()).toBe(true);
      expect(link.getText()).toEqual('View events');
    });
    it('has Pause events button', async () => {
      const button = clusterDashboardView.eventsPauseButton;
      expect(button.isDisplayed()).toBe(true);
      expect(button.getText()).toEqual('Pause');
      await button.click();
      expect(button.getText()).toEqual('Resume');
    });
  });
});
