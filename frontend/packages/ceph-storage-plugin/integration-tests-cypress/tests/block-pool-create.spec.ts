import { checkErrors } from '../../../integration-tests-cypress/support';
import { createBlockPool, deleteBlockPoolFromCli } from '../views/block-pool';

describe('Test block pool creation under ODF UI', () => {
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
