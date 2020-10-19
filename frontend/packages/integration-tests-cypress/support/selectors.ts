export {};
declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      byTestID(selector: string): Chainable<Element>;
      byTestActionID(selector: string): Chainable<Element>;
      byLegacyTestID(selector: string): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add('byTestID', (selector: string) => {
  cy.get(`[data-test="${selector}"]`);
});
Cypress.Commands.add('byTestActionID', (selector: string) =>
  cy.get(`[data-test-action="${selector}"]:not(.pf-m-disabled)`),
);
// depreciated!  new IDs should use 'data-test', ie. `cy.byTestID(...)`
Cypress.Commands.add('byLegacyTestID', (selector: string) =>
  cy.get(`[data-test-id="${selector}"]`),
);
