// import { checkErrors } from '../../../../integration-tests-cypress/support';

export {}; // needed in files which don't have an import to trigger ES6 module usage
declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      selectByDropDownText(selector: string, dropdownText: string): Chainable<Element>;
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
});

after(() => {
  cy.logout();
});

afterEach(() => {
  // checkErrors();
});

Cypress.Commands.add('selectByDropDownText', (selector: string, dropdownText: string) => {
  cy.get(selector).click();
  cy.get('ul.pf-c-dropdown__menu li button').each(($el) => {
    if ($el.text().includes(dropdownText)) {
      $el.click();
    }
  });
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
