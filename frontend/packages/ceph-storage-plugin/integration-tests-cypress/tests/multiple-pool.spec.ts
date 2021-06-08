import { modal } from '../../../integration-tests-cypress/views/modal';
import { checkErrors } from '../../../integration-tests-cypress/support';
import { POOL_PROGRESS } from '../../src/constants/storage-pool-const';
import {
  poolName,
  populateBlockPoolForm,
  blockPoolFooter,
  deleteBlockPoolFromCli,
  verifyBlockPoolJSON,
} from '../views/block-pool';

const prepareStorageClassForm = () => {
  cy.log('Selecting provisioner');
  cy.byTestID('storage-class-provisioner-dropdown').click();
  cy.byLegacyTestID('dropdown-text-filter').type('openshift-storage.rbd.csi.ceph.com');
  cy.byTestID('dropdown-menu-item-link').contains('openshift-storage.rbd.csi.ceph.com');
  cy.byTestID('dropdown-menu-item-link').click();

  cy.log('Creating a new block pool');
  cy.byTestID('pool-dropdown-toggle').click();
  cy.byTestID('create-new-pool-button').click();
};

const createBlockPool = (poolCreationAction: string) => {
  cy.log('Make sure the storage pool creation form is open');
  modal.shouldBeOpened();
  modal.modalTitleShouldContain('Create BlockPool');
  populateBlockPoolForm();
  blockPoolFooter('create');

  cy.log('Verify a new block pool creation');
  blockPoolFooter(poolCreationAction);
  cy.byTestID('pool-dropdown-toggle').contains(poolName);
  verifyBlockPoolJSON();
};

describe('Test Ceph pool creation', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
  });

  after(() => {
    checkErrors();
    cy.logout();
  });

  it('Check for a new pool creation', () => {
    cy.visit('/');
    cy.clickNavLink(['Storage', 'StorageClasses']);
    cy.byTestID('item-create').click();

    cy.log('Test creation of a new pool');
    prepareStorageClassForm();
    createBlockPool(POOL_PROGRESS.CREATED);

    cy.log('Try to create a new pool with already existing name');
    prepareStorageClassForm();
    createBlockPool(POOL_PROGRESS.FAILED);

    deleteBlockPoolFromCli();
  });
});
