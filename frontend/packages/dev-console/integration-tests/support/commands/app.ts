export {}; // needed in files which don't have an import to trigger ES6 module usage
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare
  namespace Cypress {
    interface Chainable<Subject> {
      pageTitleShouldContain(title: string): Chainable<Element>;
      alertTitleShouldContain(title: string): Chainable<Element>;
      clickBreadcrumbLink(linkName: string): Chainable<Element>;
      clickKebabAction(resourceName: string, actionName: string): Chainable<Element>;
      selectActionsMenuOption(actionsMenuOption: string): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('pageTitleShouldContain', (title: string) => {
  cy.get('[data-test-id ="resource-title"]')
    .should('be.visible')
    .and('contain.text', title);
});

Cypress.Commands.add('alertTitleShouldContain', (alertTitle: string) => {
  cy.byLegacyTestID('modal-title').should('contain.text', alertTitle);
});

Cypress.Commands.add('clickBreadcrumbLink', (linkName: string) => {
  cy.get('nav[aria-label="Breadcrumb"] ol li a')
    .contains(linkName)
    .click();
});

Cypress.Commands.add('clickKebabAction', (resourceName: string, actionName: string) => {
  cy.get(`[data-test-rows="resource-row"]`)
    .contains(resourceName)
    .byLegacyTestID('kebab-button')
    .click();
  cy.byTestActionID(actionName).click();
});

Cypress.Commands.add('selectActionsMenuOption', (actionsMenuOption: string) => {
  cy.byLegacyTestID('actions-menu-button').click();
  cy.byTestActionID(actionsMenuOption)
    .should('be.visible')
    .click();
});

before(() => {
  cy.visit('/');
});
