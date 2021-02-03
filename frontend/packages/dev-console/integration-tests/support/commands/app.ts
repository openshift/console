// import { checkErrors } from '../../../../integration-tests-cypress/support';

export {}; // needed in files which don't have an import to trigger ES6 module usage

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      pageTitleShouldContain(title: string): Chainable<Element>;
      alertTitleShouldContain(title: string): Chainable<Element>;
      clickNavLink(path: [string, string]): Chainable<Element>;
      selectByDropDownText(selector: string, dropdownText: string): Chainable<Element>;
      verifyDropdownselected(selector: string): Chainable<Element>;
      mouseHover(selector: string): Chainable<Element>;
      selectValueFromAutoCompleteDropDown(
        selector: string,
        dropdownText: string,
      ): Chainable<Element>;
      selectActionsMenuOption(actionsMenuOption: string): Chainable<Element>;
    }
  }
}

before(() => {
  cy.login();
  cy.visit('');
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
});

after(() => {
  cy.logout();
});

afterEach(() => {
  // checkErrors();
});

Cypress.Commands.add('pageTitleShouldContain', (title: string) => {
  cy.get('[data-test-id ="resource-title"]')
    .should('be.visible')
    .and('contain.text', title);
});

Cypress.Commands.add('alertTitleShouldContain', (alertTitle: string) => {
  cy.byLegacyTestID('modal-title').should('contain.text', alertTitle);
});

Cypress.Commands.add('clickNavLink', (path: [string, string]) => {
  cy.get(`[data-component="pf-nav-expandable"]`) // this assumes all top level menu items are expandable
    .contains(path[0])
    .click(); // open top, expandable menu
  cy.get('#page-sidebar')
    .contains(path[1])
    .click();
});

Cypress.Commands.add('selectByDropDownText', (selector: string, dropdownText: string) => {
  cy.get(selector).click();
  cy.get('ul.pf-c-dropdown__menu li button').each(($el) => {
    if ($el.text().includes(dropdownText)) {
      $el.click();
    }
  });
});

Cypress.Commands.add('verifyDropdownselected', (selector: string) => {
  cy.get(selector).should('be.visible');
  cy.get(selector)
    .click()
    .get('.pf-c-dropdown__menu')
    .should('be.visible');
});

Cypress.Commands.add('mouseHover', (selector: string) => {
  cy.get(selector)
    .invoke('show')
    .should('be.visible')
    .trigger('mouseover');
});

Cypress.Commands.add(
  'selectValueFromAutoCompleteDropDown',
  (selector: string, dropdownText: string) => {
    cy.get(selector).click();
    cy.byLegacyTestID('dropdown-text-filter').type(dropdownText);
    cy.get('ul[role="listbox"]')
      .find('li')
      .contains(dropdownText)
      .click();
  },
);

Cypress.Commands.add('selectActionsMenuOption', (actionsMenuOption: string) => {
  cy.byLegacyTestID('actions-menu-button').click();
  cy.byTestActionID(actionsMenuOption)
    .should('be.visible')
    .click();
});
