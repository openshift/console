export const logs = {
  toggleOptions: () => {
    // click configuration dropdown
    cy.get('button[data-test="resource-log-options-toggle"]').click();
  },
  checkLogWraped: (flag: boolean) => {
    // open options
    logs.toggleOptions();
    if (flag) {
      cy.get('li[data-test-dropdown-menu="wrap-lines"] input').should('be.checked');
    } else {
      cy.get('li[data-test-dropdown-menu="wrap-lines"] input').should('not.be.checked');
    }
    // close options
    logs.toggleOptions();
  },
  selectContainer: (containerName: string) => {
    cy.get('button[data-test="container-select"]').click();
    cy.contains('span', `${containerName}`)
      .parent()
      .parent()
      .parent()
      .parent('button[role="option"]')
      .click();
  },
  setLogWrap: (flag: boolean) => {
    logs.toggleOptions();
    if (flag) {
      cy.get('li[data-test-dropdown-menu="wrap-lines"] input').check();
    } else {
      cy.get('li[data-test-dropdown-menu="wrap-lines"] input').uncheck();
    }
    logs.toggleOptions();
  },
  searchLogs: (text: string) => {
    cy.get('input[placeholder="Search logs"]').clear().type(text);
  },
};
