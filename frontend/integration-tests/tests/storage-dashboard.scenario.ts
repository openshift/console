import { browser } from 'protractor';
import { appHost } from '../protractor.conf';
import { dashboardIsLoaded } from '../views/dashboard-shared.view';
import { serviceName, clusterHealth, clusterName, allNodes } from '../views/storage-dashboard.view';
import { execSync } from 'child_process';

describe('Check data on Storage Dashboard.', () => {
  beforeAll(async() => {
    await browser.get(`${appHost}/dashboards/persistent-storage`);
    await dashboardIsLoaded();
  });

  it('Check cluster health is OK', async() => {
    expect(clusterHealth.getText()).toContain('is healthy');
  });

  it('Check service name is OCS', async() => {
    expect(serviceName.getText()).toEqual('OpenShift Container Storage');
  });

  it('Check that cluster name is correct', async() => {
    const cephClusterName = execSync('oc describe cephcluster -n openshift-storage|sed -n "s/^Name: \\+//p"');
    expect(clusterName.getText()).toEqual(cephClusterName.toString().trim());
  });

  it('Check the total number of OCS nodes', async() => {
    const ocsNodesNumber = execSync('oc describe nodes|grep -c cluster.ocs.openshift.io/openshift-storage');
    expect(allNodes.getText()).toEqual(`${ocsNodesNumber.toString().trim()} Nodes`);
  });

});
