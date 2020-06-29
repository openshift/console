export const operatorsPage = {
  navigateToOperaotorHubPage: () => {
    cy.get('[data-component="pf-nav-expandable"]')
      .contains('Operators')
      .click();
    cy.get('.pf-c-nav__link')
      .contains('OperatorHub')
      .should('be.visible');
    cy.get('.pf-c-nav__link')
      .contains('OperatorHub')
      .click();
  },

  searchOperator: (operatorName) => {
    cy.get('input[placeholder="Filter by keyword..."]').type(operatorName);
    cy.get('.co-catalog-page__num-items').should('be.visible');
  },

  installPipelineOperator: () => {
    cy.get('.co-m-nav-title')
      .find('h1')
      .should('have.text', 'Install Operator');
    cy.byButtonText('Install').click();
    cy.byLegacyTestID('resource-title').should('have.text', 'Installed Operators');
  },

  verifyPipelineOperatorSubscriptionPage: () => {
    cy.get('.co-m-nav-title')
      .find('h1')
      .should('have.text', 'Install Operator');
    cy.get('h1.co-clusterserviceversion-logo__name__clusterserviceversion').should(
      'have.text',
      'OpenShift Pipelines Operator',
    );
  },

  verifyInstalledOperator: (operatorName) => {
    // cy.get('[role="dialog"]').find('[data-test-id="operator-uninstall-btn"]').should('be.exist');
    cy.get('h1.co-clusterserviceversion-logo__name__clusterserviceversion').should(
      'have.text',
      operatorName,
    );
  },

  titleShouldBe: (title: string) => cy.byTestID('resource-title').contains(title),
  headingDisplayed: (heading: string) => cy.get('h1').contains(heading),

  // installPipelineOperator: () => {
  //   cy.byTestID('openshift-pipelines-operator-rh-redhat-operators-openshift-marketplace').click();
  //   cy.get('[role="dialog"]')
  //     .byLegacyTestID('operator-modal-header')
  //     .should('be.exist');
  //   cy.byLegacyTestID('operator-install-btn').click();
  //   cy.get('.co-m-nav-title')
  //     .find('h1')
  //     .should('have.text', 'Install Operator');
  //   cy.byButtonText('Install').click();
  //   cy.byLegacyTestID('resource-title').should('have.text', 'Installed Operators');
  // },

  verifyPipelineoperatorInstalled: () => {
    cy.get('[role="dialog"]')
      .find('[data-test-id="operator-uninstall-btn"]')
      .should('be.exist');
  },
};
