import { checkErrors } from '../../../../integration-tests-cypress/support';

export {}; // needed in files which don't have an import to trigger ES6 module usage
declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      selectValueFromAutoCompleteDropDown(
        selector: string,
        dropdownText: string,
      ): Chainable<Element>;
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
  checkErrors();
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
