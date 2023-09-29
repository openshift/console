import { checkErrors } from '../../../integration-tests-cypress/support';
import { detailsPage } from '../../../integration-tests-cypress/views/details-page';
import { modal } from '../../../integration-tests-cypress/views/modal';

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

  it('disables default catalog sources from operatorHub details page', () => {
    cy.log('navigate to operatorHub page');
    cy.visit(`/settings/cluster`);
    cy.byLegacyTestID('horizontal-link-Configuration').click();
    cy.byLegacyTestID('OperatorHub').click();

    // verfiy operatorHub details page is open
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
