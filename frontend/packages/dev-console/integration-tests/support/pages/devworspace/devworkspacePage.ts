export const devWorkspacePage = {
  verifyDevWsResourceStatus: (status: string) => {
    cy.byTestID('resource-status').should('have.text', status);
  },
};
