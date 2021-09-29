import { checkErrors } from '../../../integration-tests-cypress/support';
import { createBlockPool, deleteBlockPoolFromCli } from '../views/block-pool';

/** @depricated testcases are moved to odf-console */
xdescribe('Test block pool creation under OCS UI', () => {
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
    createBlockPool();
    deleteBlockPoolFromCli();
  });
});
