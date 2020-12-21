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

export const poolMessage = {
  PROGRESS:
    'The creation of an OCS storage cluster is still in progress or have failed please try again after the storage cluster is ready to use.',
  POOL_START: (poolName) => `Pool ${poolName} creation in progress`,
  POOL_DUPLICATED: (poolName) => `Pool "${poolName}" already exists`,
  POOL_CREATED: (poolName) => `Pool ${poolName} was successfully created`,
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
  create: (poolName: string, replicaCount: string, poolCreationJobStatus: string) => {
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
    storagePool.validate(emptyStateBody, poolMessage.POOL_START(poolName));
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
