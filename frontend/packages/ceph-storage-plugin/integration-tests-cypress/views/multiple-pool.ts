import { NS } from '../utils/consts';
import { modal } from '../../../integration-tests-cypress/views/modal';

// Create storage class from
export const storagePoolDropdown: string = 'pool-dropdown-toggle';

// Create new pool form
export const poolNameTextBox: string = 'new-pool-name-textbox';
export const replicaDropdown: string = 'replica-dropdown';
export const confirmAction: string = 'confirm-action';

// Pool status
export const emptyStateBody: string = 'empty-state-body';

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
    modal.modalTitleShouldContain('Create New Storage Pool');
    modal.submitShouldBeDisabled();
    modal.shouldBeOpened();

    cy.byTestID(poolNameTextBox)
      .clear()
      .type(poolName);
    cy.byTestID(replicaDropdown).click();
    cy.byLegacyTestID(replicaCount)
      .last()
      .contains(`${replicaCount}-way Replication`)
      .click();

    // Create new pool
    cy.byTestID(confirmAction)
      .last()
      .click();

    // Validations
    storagePool.validate(emptyStateBody, poolMessage[poolCreationJobStatus](poolName));

    // Close a pool creation form
    cy.byTestID(confirmAction)
      .last()
      .click();
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
