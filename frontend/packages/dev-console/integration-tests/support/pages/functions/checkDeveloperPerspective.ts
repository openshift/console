export const checkDeveloperPerspective = (tries: number = 5) => {
  if (tries < 1) {
    return;
  }
  cy.get('body').then(($body) => {
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    if ($body.find('[data-tour-id="perspective-switcher-menu-option"]').length !== 0) {
      cy.byLegacyTestID('perspective-switcher-menu-option').contains('Developer');
    } else {
      cy.reload();
      cy.document().its('readyState').should('eq', 'complete');
      checkDeveloperPerspective(tries - 1);
    }
  });
};
