import { testName } from '@console/cypress-integration-tests/support';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { nav } from '@console/cypress-integration-tests/views/nav';

export const operator = {
  install: (operatorName: string, operatorHubCardID: string) => {
    nav.sidenav.clickNavLink(['Operators', 'OperatorHub']);
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.log('go to operator overview panel');
    cy.byTestID(operatorHubCardID).click();
    cy.log('go to the install form');
    cy.byLegacyTestID('operator-install-btn').click({ force: true });
    cy.log('configure Operator install form for single namespace');
    cy.byTestID('A specific namespace on the cluster-radio-input').check();
    cy.log(`verify namespace dropdown shows the ${testName} namespace`);
    cy.byTestID('dropdown-selectbox').should('contain', `${testName}`);
    cy.byTestID('install-operator').click();
    cy.log('verify Operator began installation');
    cy.byTestID('view-installed-operators-btn').should(
      'contain',
      `View installed Operators in Namespace ${testName}`,
    );
    cy.log(`navigate to OperatorHub in Namespace ${testName}`);
    cy.byTestID('view-installed-operators-btn').click();
    cy.log(`verify the Operator row for ${operatorName} exists`);
    cy.byTestOperatorRow(operatorName, { timeout: 60000 }).should('exist');
    cy.byTestOperatorRow(operatorName)
      .parents('tr')
      .within(() => {
        cy.byTestID('status-text').should('have.text', 'Succeeded');
      });
  },
  uninstallModal: {
    open: () => {
      detailsPage.clickPageActionFromDropdown('Uninstall Operator');
      modal.shouldBeOpened();
      modal.modalTitleShouldContain('Uninstall Operator?');
      cy.get('.loading-skeleton--table').should('not.exist');
    },
    checkDeleteAllOperands: () =>
      cy.byTestID('Delete all operand instances for this operator__checkbox').click(),
  },
};
