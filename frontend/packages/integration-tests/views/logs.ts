export const logs = {
  toggleOptions: () => {
    // click configuration dropdown
    cy.byTestID('resource-log-options-toggle').click();
  },
  checkLogWraped: (flag: boolean) => {
    // open options
    logs.toggleOptions();
    if (flag) {
      cy.byTestDropDownMenu('wrap-lines').within(() => {
        cy.get('input').should('be.checked');
      });
    } else {
      cy.byTestDropDownMenu('wrap-lines').within(() => {
        cy.get('input').should('not.be.checked');
      });
    }
    // close options
    logs.toggleOptions();
  },
  setLogWrap: (flag: boolean) => {
    logs.toggleOptions();
    if (flag) {
      cy.byTestDropDownMenu('wrap-lines').within(() => {
        cy.get('input').check();
      });
    } else {
      cy.byTestDropDownMenu('wrap-lines').within(() => {
        cy.get('input').uncheck();
      });
    }
    logs.toggleOptions();
  },
  searchLogs: (text: string) => {
    cy.get('input[placeholder="Search logs"]').clear().type(text);
  },
};
