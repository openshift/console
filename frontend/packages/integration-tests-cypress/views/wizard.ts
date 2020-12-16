export const wizard = {
  next: () => {
    cy.get('.pf-c-button.pf-m-primary')
      .contains('Next')
      .click();
  },
  create: () => {
    cy.get('.pf-c-button.pf-m-primary')
      .contains('Create')
      .click();
  },
};
