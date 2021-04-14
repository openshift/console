import { checkErrors } from '../../../integration-tests-cypress/support';
import { storagePool, PoolState } from '../views/multiple-pool';

// Pool var
const poolName: string = 'example.pool';
const replicaCount: string = '2';

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
    storagePool.prepareStorageClassForm();
    storagePool.create(poolName, replicaCount, PoolState.CREATED);

    cy.log('Verify a newly created pool');
    storagePool.verify(poolName, replicaCount);

    cy.log('Try to create a new pool with already existing name');
    storagePool.prepareStorageClassForm();
    storagePool.create(poolName, replicaCount, PoolState.DUPLICATED);

    cy.log('Deleting a pool');
    storagePool.delete(poolName);
  });
});
