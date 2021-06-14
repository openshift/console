import { K8sResourceKind } from '@console/internal/module/k8s';
import { OCS_INTERNAL_CR_NAME } from '../../src/constants';
import { DeviceSet } from '../../src/types';
import { getCurrentDeviceSetIndex } from '../../src/utils/add-capacity';
import { NS } from '../consts';

export const withJSONResult = (res: Cypress.Exec, scName: string, iAndD: IndexAndDeviceSet) => {
  const jsonOut: K8sResourceKind = JSON.parse(res.stdout);
  iAndD.deviceSets = jsonOut.spec.storageDeviceSets;
  iAndD.index = getCurrentDeviceSetIndex(iAndD.deviceSets, scName);
};

export const fetchStorageClusterJson = () =>
  cy.exec(`kubectl get --ignore-not-found storagecluster ${OCS_INTERNAL_CR_NAME} -n ${NS} -o json`);

export const fetchWorkerNodesJson = () =>
  cy.exec('oc get nodes -l "node-role.kubernetes.io/worker" -o json');

export const addCapacity = (uid: string, scName: string) => {
  cy.byLegacyTestID('kebab-button').click(); // 'data-test-id'
  cy.byTestActionID('Add Capacity').click(); // 'data-test-action'
  cy.byTestID('add-cap-sc-dropdown').click(); // 'data-test'
  cy.byTestID('dropdown-menu-item-link')
    .contains(scName)
    .click();
  cy.byTestID('confirm-action').click();
};

export const newStorageClassTests = (
  beforeCapacityAddition: UidAndDeviceSet,
  iAndD: IndexAndDeviceSet,
  portability: boolean,
) => {
  const portabilityStatus = portability ? 'enabled' : 'disabled';
  cy.log('New device set is created');
  expect(iAndD.deviceSets.length).toBe(beforeCapacityAddition.deviceSets.length + 1);

  cy.log('Device count is 1 in the new device set');
  expect(iAndD.deviceSets[iAndD.index].count).toBe(1);

  cy.log(`Osd portability is ${portabilityStatus} in the new device set`);
  expect(iAndD.deviceSets[iAndD.index].portable).toBe(portability);
};

export const existingStorageClassTests = (
  beforeCapacityAddition: UidAndDeviceSet,
  iAndD: IndexAndDeviceSet,
) => {
  cy.log('New device set is not created');
  expect(iAndD.deviceSets.length).toBe(beforeCapacityAddition.deviceSets.length);

  cy.log('Devices count is incremented by 1 in the corresponding device set');
  expect(iAndD.deviceSets[iAndD.index].count).toBe(beforeCapacityAddition.devicesCount + 1);

  cy.log('Osd portability is not modified in the corresponding device set');
  expect(iAndD.deviceSets[iAndD.index].portable).toBe(beforeCapacityAddition.portability);
};

export interface IndexAndDeviceSet {
  index: number;
  deviceSets: DeviceSet[];
}

export interface UidAndDeviceSet {
  uid: string;
  deviceSets: DeviceSet[];
  portability?: boolean;
  devicesCount?: number;
}
