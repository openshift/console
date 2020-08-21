export {}; // needed in files which don't have an import to trigger ES6 module usage
declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      clickNavLink(path: [string, string]): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add('clickNavLink', (path: [string, string]) => {
  cy.get('#page-sidebar')
    .contains(path[0])
    .click();
  if (path.length === 2) {
    cy.get('#page-sidebar')
      .contains(path[1])
      .click();
  }
});
