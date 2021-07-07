export const secrets = {
  clickCreateKeyValSecretDropdownButton: () => {
    cy.byTestID('item-create')
      .click()
      .get('body')
      .then(($body) => {
        if ($body.find(`[data-test-dropdown-menu="generic"]`).length) {
          cy.get(`[data-test-dropdown-menu="generic"]`).click();
        }
      });
  },
};
