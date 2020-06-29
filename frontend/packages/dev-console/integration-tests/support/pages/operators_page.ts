export const operatorsPage = {
  titleShouldBe: (title: string) => cy.byTestID('resource-title').contains(title),
  headingDisplayed: (heading: string) => cy.get('h1').contains(heading),

  searchOperator: (operatorName: string) => {
    cy.get('[placeholder="Filter by keyword..."]').contains(operatorName);
  },

  installPipelineOperator: () => {
    cy.byTestID('openshift-pipelines-operator-rh-redhat-operators-openshift-marketplace').click();
    cy.get('[role="dialog"]')
      .byLegacyTestID('operator-modal-header')
      .should('be.exist');
    cy.byLegacyTestID('operator-install-btn').click();
    cy.get('.co-m-nav-title')
      .find('h1')
      .should('have.text', 'Install Operator');
    cy.byButtonText('Install').click();
    cy.byLegacyTestID('resource-title').should('have.text', 'Installed Operators');
  },

  verifyPipelineoperatorInstalled: () => {
    cy.get('[role="dialog"]')
      .find('[data-test-id="operator-uninstall-btn"]')
      .should('be.exist');
  },
};
