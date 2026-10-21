import { checkErrors } from '@console/cypress-integration-tests/support';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';

describe('Create namespace from install operators', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.initAdmin();
  });

  afterEach(() => {
    checkErrors();
  });

  it('disables default catalog sources from OperatorHub details page', () => {
    cy.log('navigate to OperatorHub page');
    cy.visit(`/settings/cluster`);
    cy.byLegacyTestID('horizontal-link-Configuration').click();
    cy.byLegacyTestID('OperatorHub').click();

    // verfiy OperatorHub details page is open
    detailsPage.sectionHeaderShouldExist('OperatorHub details');

    // Toggle default sources modal
    const defaultSourceToBeToggled = 'redhat-operators';
    cy.byTestID('Default sources-details-item__edit-button').click();
    modal.modalTitleShouldContain('Edit default sources');
    cy.byTestID(`${defaultSourceToBeToggled}__checkbox`).click();
    modal.submit();

    // Verify status change
    cy.byTestID(`status_${defaultSourceToBeToggled}`).should('have.text', 'Disabled');

    // switch the toggle back to previous state
    cy.byTestID('Default sources-details-item__edit-button').click();
    modal.modalTitleShouldContain('Edit default sources');
    cy.byTestID(`${defaultSourceToBeToggled}__checkbox`).click();
    modal.submit();

    // Verify status change
    cy.byTestID(`status_${defaultSourceToBeToggled}`).should('have.text', 'Enabled');
  });
});
