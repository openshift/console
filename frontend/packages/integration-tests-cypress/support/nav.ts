export {}; // needed in files which don't have an import to trigger ES6 module usage
declare global {
  namespace Cypress {
    interface Chainable {
      clickNavLink(path: string[]): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add('clickNavLink', (path: string[]) => {
  cy.get('#page-sidebar').then(($sidebar) => {
    // we are already at the admin perspective if the toggle isn't there,
    // so we shouldn't try to find the perspective toggle
    if (
      $sidebar.find("[data-test-id='perspective-switcher-toggle']").length !== 0 &&
      !path[0].toLowerCase().startsWith('admin')
    ) {
      cy.get('#page-sidebar')
        .contains(path[0])
        .then(($navItem) => {
          if ($navItem.attr('aria-expanded') !== 'true') {
            cy.wrap($navItem).click();
          }
        });
    }
  });

  if (path.length === 2) {
    cy.get('#page-sidebar').contains(path[1]).click();
  }
});
