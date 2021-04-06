import { NS } from '../utils/consts';
import { modal } from '../../../integration-tests-cypress/views/modal';

export const storagePoolDropdown: string = 'pool-dropdown-toggle';
export const confirmAction: string = 'confirm-action';
export enum PoolState {
  DUPLICATED = 'DUPLICATED',
  CREATED = 'CREATED',
}

type PoolMessage = {
  [key in PoolState]: (arg: string) => string;
};

export const poolMessage: PoolMessage = {
  [PoolState.DUPLICATED]: (poolName: string) => `Pool "${poolName}" already exists`,
  [PoolState.CREATED]: (poolName: string) => `Pool ${poolName} was successfully created`,
};

export const storagePool = {
  prepareStorageClassForm: () => {
    // Select provisioner
    cy.byTestID('storage-class-provisioner-dropdown').click();
    cy.byLegacyTestID('dropdown-text-filter').type('openshift-storage.rbd.csi.ceph.com');
    cy.byTestID('dropdown-menu-item-link').should('contain', 'openshift-storage.rbd.csi.ceph.com');
    cy.byTestID('dropdown-menu-item-link').click();
    // Open a storage pool creation form
    cy.byTestID(storagePoolDropdown).click();
    cy.byTestID('create-new-pool-button').click();
  },
  create: (poolName: string, replicaCount: string, poolCreationJobStatus: PoolState) => {
    // Make sure the storage pool creation form is open
    modal.modalTitleShouldContain('Create New Block Pool');
    modal.submitShouldBeDisabled();
    cy.byTestID('modal-cancel-action').should('be.visible');

    cy.byTestID('new-pool-name-textbox')
      .clear()
      .type(poolName);
    cy.byTestID('replica-dropdown').click();
    cy.byLegacyTestID(replicaCount)
      .last()
      .contains(`${replicaCount}-way Replication`)
      .click();
    cy.byTestID('compression-checkbox').check();

    // Create new pool
    cy.byTestID('modal-confirm-action')
      .last()
      .click();

    // Validations
    storagePool.validate('empty-state-body', poolMessage[poolCreationJobStatus](poolName));

    // Close a pool creation form
    cy.byTestID('modal-finish-action').click();
  },
  delete: (poolName: string) => cy.exec(`oc delete CephBlockPool ${poolName} -n ${NS}`),
  verify: (poolName: string, replicaCount: string) => {
    cy.byTestID(storagePoolDropdown).click();
    const poolDropdownItem = [poolName, `Replica ${replicaCount} no compression`];
    const regex = new RegExp(`${poolDropdownItem.join('|')}`, 'g');
    storagePool.validate(poolName, regex);
    cy.byTestID(storagePoolDropdown).click();
  },
  validate: (elementId: string, expectedValue: any) =>
    cy.byTestID(elementId).contains(expectedValue),
};
