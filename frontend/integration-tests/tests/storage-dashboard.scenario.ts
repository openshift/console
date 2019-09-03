import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '../protractor.conf';
import { isLoaded } from '../views/crud.view';
import { serviceName, clusterHealth } from '../views/storage-dashboard.view'

describe('Check data on Storage Dashboard.', () => {
  beforeAll(async() => {
    await browser.get(`${appHost}/dashboards/persistent-storage`);
    await isLoaded();
  });

  it('Check cluster health', async() => {

  //TODO: create tests for different cluster states
  expect(clusterHealth.getText()).toEqual('rook-ceph health is degraded');

  });

  it('Check service name', async() => {

  expect(serviceName.getText()).toEqual('OpenShift Container Storage');
    
  });
});
