export const roleBindings = {
  titleShouldHaveText: (title: string) => cy.byTestID('title').should('have.text', title),
  inputName: (name: string) => cy.byTestID('role-binding-name').type(name),
  selectNamespace: (namespace: string) =>
    cy
      .byTestID('namespace-dropdown')
      .click()
      .byTestID('console-select-search-input')
      .type(namespace)
      .byTestID('console-select-menu-list')
      .within(() => {
        cy.get('.co-resource-item__resource-name').click();
      }),
  selectRole: (role: string) =>
    cy
      .byTestID('role-dropdown')
      .click()
      .byTestID('console-select-search-input')
      .type(role)
      .get('#cluster-admin-ClusterRole-link')
      .click(),
  inputSubject: (subject: string) => cy.byTestID('subject-name').type(subject),
  clickSaveChangesButton: () => {
    cy.byTestID('save-changes').should('be.visible').click();
    cy.byTestID('loading-indicator').should('not.exist');
  },
};
