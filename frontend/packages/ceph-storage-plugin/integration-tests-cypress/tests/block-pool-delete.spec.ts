import { checkErrors } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { POOL_PROGRESS } from '../../src/constants/storage-pool-const';
import {
  poolName,
  scName,
  navigateToBlockPool,
  verifyFooterActions,
  poolMessage,
} from '../views/block-pool';
import { pvc } from '../views/pvc';
import { createStorageClass } from '../views/storage-class';

const pvcName: string = 'testing-pvc';

/** @depricated testcases are moved to odf-console */
xdescribe('Test block pool deletion under OCS UI', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
    // Todo(bipuladh): Enable after downstream builds are available with v1 CSIDrivers
    // cy.log('Creating a test pool');
    // createBlockPool();
  });

  after(() => {
    // Todo(bipuladh): Enable after downstream builds are available with v1 CSIDrivers
    // deleteStorageClassFromCli(scName);
    checkErrors();
    cy.logout();
  });

  // Todo(bipuladh): Enable after downstream builds are available with v1 CSIDrivers
  it('deletion of a non-default pool deletion pool is successful', () => {
    cy.log('Create storage class using newly created pool');
    createStorageClass(scName, poolName);

    cy.log('Create PVC using newly created storage class');
    cy.clickNavLink(['PersistentVolumeClaims']);
    pvc.createPVC(pvcName, '1', scName);
    cy.visit('/');

    cy.log('Delete a newly created block pool');
    navigateToBlockPool();
    cy.byLegacyTestID('kebab-button')
      .first()
      .click();
    cy.byTestActionID('Delete BlockPool').click();

    modal.modalTitleShouldContain('Delete BlockPool');
    cy.byTestID('pool-bound-message').contains(poolMessage[POOL_PROGRESS.BOUNDED]);
    cy.byTestID('pool-storage-classes').contains(scName);
    verifyFooterActions(POOL_PROGRESS.BOUNDED);

    cy.log('Delete pvc and try pool deletion');
    cy.exec(`oc delete PersistentVolumeClaim ${pvcName} -n openshift-storage`);

    cy.byLegacyTestID('kebab-button')
      .first()
      .click();
    cy.byTestActionID('Delete BlockPool').click();
    verifyFooterActions('delete');
  });

  it('Deleting the default block pools should fail', () => {
    navigateToBlockPool();
    cy.log('Click delete kebab action');
    cy.byLegacyTestID('kebab-button')
      .last()
      .click();
    cy.byTestActionID('Delete BlockPool').click();
    cy.log('Deletion not allowed message is visible');
    cy.byTestID('empty-state-body').contains(poolMessage[POOL_PROGRESS.NOTALLOWED]);
    verifyFooterActions(POOL_PROGRESS.NOTALLOWED);
  });
});
