export const dockerfilePage = {
  enterAppName: (appName: string) => {
    cy.byLegacyTestID('application-form-app-input')
      .clear()
      .type(appName);
  },
  enterName: (name: string) => {
    cy.byLegacyTestID('application-form-app-name')
      .clear()
      .type(name);
  },
};
