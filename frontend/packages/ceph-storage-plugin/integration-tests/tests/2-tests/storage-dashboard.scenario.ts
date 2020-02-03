import { execSync } from 'child_process';
import { browser } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/shared/src/test-views/dashboard-shared.view';
import {
  serviceName,
  clusterHealth,
  clusterName,
  allNodes,
} from '../../views/storage-dashboard.view';

const OCS_SERVICE_NAME = 'OpenShift Container Storage';
const STATUS_HEALTHY = 'healthy';

describe('Check data on Persistent Storage Dashboard.', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/dashboards/persistent-storage`);
    await isLoaded();
  });

  it('Check cluster is healthy', () => {
    expect(clusterHealth.getText()).toContain(STATUS_HEALTHY);
  });

  it('Check service name is OCS', () => {
    expect(serviceName.getText()).toEqual(OCS_SERVICE_NAME);
  });

  it('Check if cluster name is correct', async () => {
    const cephClusterName = execSync(
      "kubectl get cephcluster -n openshift-storage -o jsonpath='{.items..metadata.name}'",
    );
    expect(clusterName.getText()).toEqual(cephClusterName.toString().trim());
  });

  it('Check the total number of OCS nodes', async () => {
    const ocsNodesNumber = execSync(
      "kubectl get nodes -l cluster.ocs.openshift.io/openshift-storage -o json | jq '.items | length'",
    );
    expect(allNodes.getText()).toEqual(`${ocsNodesNumber.toString().trim()} Nodes`);
  });
});
