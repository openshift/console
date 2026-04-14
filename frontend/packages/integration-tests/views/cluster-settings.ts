export const clusterSettings = {
  detailsIsLoaded: (visitOptions?: Partial<Cypress.VisitOptions>) => {
    cy.visit('/settings/cluster', visitOptions);
    cy.byLegacyTestID('horizontal-link-Details').should('exist'); // wait for page to load
  },
  pauseMCP: (value: 'true' | 'false' = 'true') => {
    cy.exec(
      `oc patch mcp/worker --patch '{ "spec": { "paused": ${value} } }' --type=merge`,
      // MCO API is absent on non-OCP clusters and some CI profiles; tests still assert UI when MCP exists.
      { failOnNonZeroExit: false },
    );
  },
  openUpdateModalAndOpenDropdown: () => {
    cy.byLegacyTestID('cv-update-button').should('exist').click();
    cy.byLegacyTestID('modal-title').should('contain.text', 'Update cluster');
    cy.byTestID('update-cluster-modal').should('exist').and('be.visible');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-toggle"]')
      .should('exist')
      .and('be.visible')
      .and('not.be.disabled')
      .and('not.have.attr', 'aria-busy', 'true');
    // Query element again before clicking to ensure it's still in the DOM
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-toggle"]')
      .should('be.visible')
      .and('not.be.disabled');
    cy.byTestID('update-cluster-modal').find('[data-test="dropdown-with-switch-toggle"]').click();
  },
};
