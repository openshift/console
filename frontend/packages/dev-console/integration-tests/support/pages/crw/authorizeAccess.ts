export const authorizeAccessPage = {
  allowPermissions: () => {
    cy.get('[name="approve"]').click();
  },
};
