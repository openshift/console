import {
  testEbsSC,
  testNoProvisionerSC,
  testPersistentVolume1,
  testPersistentVolume2,
  testPersistentVolume3,
} from '../mocks/storageclass';
import { commonFlows } from '../views/common';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DeviceSet } from '../../src/types';
import { OCS_INTERNAL_CR_NAME } from '../../src/constants';
import { NS } from '../consts';
import { getCurrentDeviceSetIndex } from '../../src/utils/add-capacity';
import { getNodeRole } from '../../../console-shared/src/selectors/node';

interface IndexAndDeviceSet {
  index: number;
  deviceSets: DeviceSet[];
}

const withJSONResult = (res: Cypress.Exec, scName: string, iAndD: IndexAndDeviceSet) => {
  const jsonOut: K8sResourceKind = JSON.parse(res.stdout);
  iAndD.deviceSets = jsonOut.spec.storageDeviceSets;
  iAndD.index = getCurrentDeviceSetIndex(iAndD.deviceSets, scName);
};

const fetchStorageClusterJson = () =>
  cy.exec(`kubectl get --ignore-not-found storagecluster ${OCS_INTERNAL_CR_NAME} -n ${NS} -o json`);

const addCapacity = (uid: string, scName: string) => {
  console.log(`UID: ${uid} == SCName: ${scName}`);
  cy.byLegacyTestID('kebab-button').click(); // 'data-test-id'
  cy.byTestActionID('Add Capacity').click(); // 'data-test-action'
  cy.byTestID('add-cap-sc-dropdown').click(); // 'data-test'
  cy.byTestID('dropdown-menu-item-link')
    .contains(scName)
    .click();
  cy.byTestID('confirm-action').click();
};

describe('Add capacity using multiple storage classes', () => {
  const beforeCapacityAddition = {
    deviceSets: null,
    portability: null,
    devicesCount: null,
  };

  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
    cy.exec(`echo '${JSON.stringify(testEbsSC)}' | kubectl apply -f -`);
    cy.exec(`echo '${JSON.stringify(testNoProvisionerSC)}' | kubectl apply -f -`);
    cy.exec('oc get nodes -o json').then((res) => {
      const nodes = JSON.parse(res.stdout);
      const allWorkerNodes = nodes.items.filter((node) => getNodeRole(node) === 'worker');
      testPersistentVolume1.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0] =
        allWorkerNodes[0].metadata.name;
      testPersistentVolume2.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0] =
        allWorkerNodes[1].metadata.name;
      testPersistentVolume3.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0] =
        allWorkerNodes[2].metadata.name;
      cy.exec(`echo '${JSON.stringify(testPersistentVolume1)}' | kubectl apply -f -`);
      cy.exec(`echo '${JSON.stringify(testPersistentVolume2)}' | kubectl apply -f -`);
      cy.exec(`echo '${JSON.stringify(testPersistentVolume3)}' | kubectl apply -f -`);
    });
    commonFlows.navigateToOCS();
    cy.byLegacyTestID('horizontal-link-Storage Cluster').click();
  });
  after(() => {
    cy.exec(`echo '${JSON.stringify(testEbsSC)}' | kubectl delete -f -`);
    cy.exec(`echo '${JSON.stringify(testNoProvisionerSC)}' | kubectl delete -f -`);
    cy.exec(`echo '${JSON.stringify(testPersistentVolume1)}' | kubectl delete -f -`);
    cy.exec(`echo '${JSON.stringify(testPersistentVolume2)}' | kubectl delete -f -`);
    cy.exec(`echo '${JSON.stringify(testPersistentVolume3)}' | kubectl delete -f -`);
    cy.logout();
  });

  describe('Add capacity with a new storage class having EBS as provisioner', () => {
    const { name: scName } = testEbsSC.metadata;
    const iAndD: IndexAndDeviceSet = { index: 0, deviceSets: [] };
    before(() => {
      fetchStorageClusterJson().then((res) => {
        const json: K8sResourceKind = JSON.parse(res.stdout);
        beforeCapacityAddition.deviceSets = json.spec.storageDeviceSets.length;
        addCapacity(json.metadata.uid, scName);
        fetchStorageClusterJson().then((newRes) => {
          withJSONResult(newRes, scName, iAndD);
        });
      });
    });
    it('New device set is created', () =>
      expect(iAndD.deviceSets.length).toBe(beforeCapacityAddition.deviceSets + 1));
    it('Device count is 1 in the new device set', () =>
      expect(iAndD.deviceSets[iAndD.index].count).toBe(1));
    it('Osd portability is enabled in the new device set', () =>
      expect(iAndD.deviceSets[iAndD.index].portable).toBe(true));
  });

  describe('Add capacity with an existing storage class having EBS as provisioner', () => {
    const { name: scName } = testEbsSC.metadata;
    const iAndD: IndexAndDeviceSet = { index: 0, deviceSets: [] };
    before(() => {
      fetchStorageClusterJson().then((res) => {
        const json: K8sResourceKind = JSON.parse(res.stdout);
        const deviceSets: DeviceSet[] = json.spec.storageDeviceSets;
        const index = getCurrentDeviceSetIndex(deviceSets, scName);
        beforeCapacityAddition.deviceSets = deviceSets.length;
        beforeCapacityAddition.portability = deviceSets[index].portable;
        beforeCapacityAddition.devicesCount = deviceSets[index].count;
        addCapacity(json.metadata.uid, scName);
        fetchStorageClusterJson().then((newRes) => {
          withJSONResult(newRes, scName, iAndD);
        });
      });
    });

    it('New device set is not created', () =>
      expect(iAndD.deviceSets.length).toBe(beforeCapacityAddition.deviceSets));
    it('Devices count is incremented by 1 in the corresponding device set', () =>
      expect(iAndD.deviceSets[iAndD.index].count).toBe(beforeCapacityAddition.devicesCount + 1));
    it('Osd portability is not modified in the corresponding device set', () =>
      expect(iAndD.deviceSets[iAndD.index].portable).toBe(beforeCapacityAddition.portability));
  });

  describe(`Add capacity with a new storage class having NO-PROVISIONER as provisioner`, () => {
    const { name: scName } = testNoProvisionerSC.metadata;
    const iAndD: IndexAndDeviceSet = { index: 0, deviceSets: [] };
    before(() => {
      fetchStorageClusterJson().then((res) => {
        const json: K8sResourceKind = JSON.parse(res.stdout);
        beforeCapacityAddition.deviceSets = json.spec.storageDeviceSets.length;
        addCapacity(json.metadata.uid, scName);
        fetchStorageClusterJson().then((newRes) => {
          withJSONResult(newRes, scName, iAndD);
        });
      });
    });

    it('New device set is created', () =>
      expect(iAndD.deviceSets.length).toBe(beforeCapacityAddition.deviceSets + 1));
    it('Device count is 1 in the new device set', () =>
      expect(iAndD.deviceSets[iAndD.index].count).toBe(1));
    it('Osd portability is disabled in the new device set', () =>
      expect(iAndD.deviceSets[iAndD.index].portable).toBe(false));
  });
});
