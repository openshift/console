export const wizard = {
  next: () => {
    cy.get('.pf-v5-c-button.pf-m-primary').contains('Next').click();
  },
  create: () => {
    cy.get('.pf-v5-c-button.pf-m-primary').contains('Create').click();
  },
};
