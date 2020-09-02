export const guidedTour = {
  close: () => {
    cy.byTestID('guided-tour-modal').then(($tour) => {
      if ($tour) {
        cy.byTestID('tour-step-footer-secondary')
          .contains('Skip tour')
          .click()
          .byTestID('tour-step-footer-primary')
          .contains('Close')
          .click();
      }
    });
  },
};
