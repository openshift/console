export const guidedTour = {
  close: () => {
    cy.get('body').then(($body) => {
      if ($body.find(`[data-test="guided-tour-modal"]`).length) {
        // if ($body.find(`#guided-tour-modal`).length) {
        cy.byTestID('tour-step-footer-secondary')
          // cy.get('#tour-step-footer-secondary')
          .contains('Skip tour')
          .click()
          .byTestID('tour-step-footer-primary')
          .should('exist')
          // cy.get('#tour-step-footer-primary')
          .contains('Close')
          .click();
      }
    });
  },
};
