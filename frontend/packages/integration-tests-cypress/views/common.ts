export const ODFCommon = {
  visitStorageDashboard: () => {
    cy.clickNavLink(['Storage', 'OpenShift Data Foundation']);
  },
  visitStorageSystemList: () => {
    cy.clickNavLink(['Storage', 'OpenShift Data Foundation']);
    cy.contains('Storage Systems').click();
  },
};

export const resourceStatusShouldContain = (desiredStatus: string, options?: any) =>
  cy.contains('[data-test="status-text"]', desiredStatus, options);

export const isLoaded = (id: string) => cy.byTestID(id).should('exist');
export const selectActionsMenuOption = (actionsMenuOption: string) => {
  cy.byLegacyTestID('actions-menu-button').click();
  cy.byTestActionID(actionsMenuOption)
    .should('be.visible')
    .click();
};

export const projectDropdown = {
  shouldExist: () => cy.byLegacyTestID('namespace-bar-dropdown').should('exist'),
  selectProject: (projectName: string) => {
    cy.byLegacyTestID('namespace-bar-dropdown')
      .contains('Project:')
      .click();
    cy.byTestID('showSystemSwitch').check();
    cy.byTestID('dropdown-menu-item-link')
      .contains(projectName)
      .click();
  },
  shouldContain: (name: string) =>
    cy
      .byLegacyTestID('namespace-bar-dropdown')
      .contains(name)
      .should('exist'),
  shouldNotContain: (name: string) =>
    cy.byLegacyTestID('namespace-bar-dropdown').should('not.contain', name),
  shouldNotExist: () => cy.byLegacyTestID('namespace-bar-dropdown').should('not.exist'),
};
