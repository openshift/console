/** OperatorHub can render tiles before the search and filter controls are ready. */
export const OPERATOR_HUB_LOAD_TIMEOUT = 60000;

export const operatorHub = {
  waitForLoaded: () => {
    cy.get('.skeleton-catalog--grid', { timeout: OPERATOR_HUB_LOAD_TIMEOUT }).should('not.exist');
    cy.byTestID('search-operatorhub', { timeout: OPERATOR_HUB_LOAD_TIMEOUT }).should('be.visible');
    cy.get('[data-test-group-name="catalogSourceDisplayName"]', {
      timeout: OPERATOR_HUB_LOAD_TIMEOUT,
    }).should('be.visible');
    cy.get('.co-catalog-tile', { timeout: OPERATOR_HUB_LOAD_TIMEOUT })
      .its('length')
      .should('be.gt', 0);
  },
};
