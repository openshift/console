export const controls = {
  dropdown: {
    switchTo: (newOption: string) => {
      cy.byLegacyTestID('dropdown-button')
        .click()
        .get('.pf-c-dropdown__menu')
        .contains(newOption)
        .click();
    },
    verifyVisibility: () => {
      cy.byLegacyTestID('dropdown-button').should('be.visible');
      cy.byLegacyTestID('dropdown-button')
        .click()
        .get('.pf-c-dropdown__menu')
        .should('be.visible');
    },
  },
};
