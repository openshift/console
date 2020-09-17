export {}; // needed in files which don't have an import to trigger ES6 module usage
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare
  namespace Cypress {
    interface Chainable<Subject> {
      titleShouldBe(title: string): Chainable<Element>;
      alertTitleShouldBe(title: string): Chainable<Element>;
      selectLinkInBreadCrumb(linkName: string): Chainable<Element>;
      selectKebabMenuOption(kebabMenuOption: string): Chainable<Element>;
      selectActionsMenuOption(actionsMenuOption: string): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('titleShouldBe', (title: string) => {
  cy.get('[data-test-id ="resource-title"]')
    .should('be.visible')
    .and('contain.text', title);
});

Cypress.Commands.add('alertTitleShouldBe', (alertTitle: string) => {
  cy.byLegacyTestID('modal-title').should('contain.text', alertTitle);
});

Cypress.Commands.add('selectLinkInBreadCrumb', (linkName: string) => {
  cy.get('nav[aria-label="Breadcrumb"] ol li a')
    .contains(linkName)
    .click();
});

Cypress.Commands.add('selectKebabMenuOption', (kebabMenuOption: string) => {
  cy.byTestActionID(kebabMenuOption).click();
});

Cypress.Commands.add('selectActionsMenuOption', (actionsMenuOption: string) => {
  cy.byLegacyTestID('actions-menu-button').click();
  cy.byTestActionID(actionsMenuOption)
    .should('be.visible')
    .click();
});

before(() => {
  cy.visit('/');
  // cy.get('body').then(($body) => {
  //   if ($body.find('a[title="Log in with kube:admin"]').length) {
  //     cy.get('a[title="Log in with kube:admin"]').click().then(() => {
  //       cy.url().should('include', 'login');
  //     })
  //   }
  // })
  // cy.get('#inputUsername').type(Cypress.env('username'));
  // cy.get('#inputPassword').type(Cypress.env('password'));
  // cy.get('[type="submit"]').click();
  // cy.get('[aria-label="Help menu"]').should('be.visible');
});

// after(() => {
//   projectNameSpace.deleteProjectNameSpace();
// })
