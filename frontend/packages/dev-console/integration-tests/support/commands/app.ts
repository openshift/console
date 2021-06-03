// import { checkErrors } from '../../../../integration-tests-cypress/support';

export {}; // needed in files which don't have an import to trigger ES6 module usage

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      alertTitleShouldContain(title: string): Chainable<Element>;
      clickNavLink(path: [string, string]): Chainable<Element>;
      selectByDropDownText(selector: string, dropdownText: string): Chainable<Element>;
      selectByAutoCompleteDropDownText(selector: string, dropdownText: string): Chainable<Element>;
      verifyDropdownselected(selector: string): Chainable<Element>;
      mouseHover(selector: string): Chainable<Element>;
      selectValueFromAutoCompleteDropDown(
        selector: string,
        dropdownText: string,
      ): Chainable<Element>;
      selectActionsMenuOption(actionsMenuOption: string): Chainable<Element>;
      dropdownSwitchTo(dropdownMenuOption: string): Chainable<Element>;
      isDropdownVisible(): Chainable<Element>;
    }
  }
}

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
  cy.get('li')
    .contains(dropdownText)
    .click({ force: true });
});

Cypress.Commands.add(
  'selectByAutoCompleteDropDownText',
  (selector: string, dropdownText: string) => {
    cy.get(selector).click();
    cy.byLegacyTestID('dropdown-text-filter').type(dropdownText);
    cy.get(`[id*="${dropdownText}-link"]`).click({ force: true });
  },
);

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
    .trigger('mouseover', { force: true });
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

Cypress.Commands.add('dropdownSwitchTo', (dropdownMenuOption: string) => {
  cy.byLegacyTestID('dropdown-button')
    .click()
    .get('.pf-c-dropdown__menu')
    .contains(dropdownMenuOption)
    .click();
});

Cypress.Commands.add('isDropdownVisible', () => {
  cy.byLegacyTestID('dropdown-button')
    .should('be.visible')
    .click()
    .get('.pf-c-dropdown__menu')
    .should('be.visible');
});
