export const resourceStatusShouldContain = (desiredStatus: string, options?: any) =>
  cy.contains('[data-test="status-text"]', desiredStatus, options);

export const projectDropdown = {
  shouldExist: () => cy.byLegacyTestID('namespace-bar-dropdown').should('exist'),
  selectProject: (projectName: string) => {
    cy.reload();
    cy.byLegacyTestID('namespace-bar-dropdown').contains('Project:').click();
    cy.byTestID('showSystemSwitch').check();
    cy.byTestID('dropdown-menu-item-link').contains(projectName).click();
    // TODO - remove and fix properly
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
  },
  shouldContain: (name: string) =>
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.byLegacyTestID('namespace-bar-dropdown').contains(name).should('exist').wait(3000),
  shouldNotContain: (name: string) =>
    cy.byLegacyTestID('namespace-bar-dropdown').should('not.contain', name),
  shouldNotExist: () => cy.byLegacyTestID('namespace-bar-dropdown').should('not.exist'),
};

export const isLocalDevEnvironment = Cypress.config('baseUrl').includes('localhost');
