import { checkErrors } from '@console/cypress-integration-tests/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import {
  createBlockPool,
  deleteBlockPoolFromCli,
  verifyFooterActions,
  verifyBlockPoolJSON,
} from '../views/block-pool';

describe('Test block pool update under ODF UI', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
    cy.log('Creating a test pool');
    createBlockPool();
  });

  after(() => {
    deleteBlockPoolFromCli();
    checkErrors();
    cy.logout();
  });

  it('Test editing a non-default block pool is succesfu', () => {
    cy.log('Updating a newly created block pool');
    cy.byLegacyTestID('kebab-button')
      .first()
      .click();
    cy.byTestActionID('Edit BlockPool').click();

    modal.modalTitleShouldContain('Edit BlockPool');
    cy.byTestID('replica-dropdown').click();
    cy.byLegacyTestID('replica-dropdown-item')
      .contains('3-way Replication')
      .click();
    cy.byTestID('compression-checkbox').uncheck();

    cy.log('Updating pool');
    verifyFooterActions('update');

    cy.log('Verify pool update');
    verifyBlockPoolJSON(false, '3');
  });

  it('Test editing a default block pool is not allowed', () => {
    cy.log('Click edit kebab action');
    cy.byLegacyTestID('kebab-button').should('be.disabled');
  });
});
