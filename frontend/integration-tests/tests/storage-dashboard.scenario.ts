import { browser } from 'protractor';
import { appHost } from '../protractor.conf';
import { dashboardIsLoaded } from '../views/dashboard-shared.view';
import { serviceName, clusterHealth } from '../views/storage-dashboard.view';

describe('Check data on Storage Dashboard.', () => {
  beforeAll(async() => {
    await browser.get(`${appHost}/dashboards/persistent-storage`);
    await dashboardIsLoaded();
  });

  it('Check cluster health is OK', async () => {
    expect(clusterHealth.getText()).toContain('is healthy');
  });

  it('Check service name is OCS', async () => {
    expect(serviceName.getText()).toEqual('OpenShift Container Storage');
  });
});
