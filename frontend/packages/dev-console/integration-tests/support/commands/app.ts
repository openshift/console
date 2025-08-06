// import { checkErrors } from '../../../../integration-tests-cypress/support';

import { formPO } from '../pageObjects';
import { app } from '../pages';

export {}; // needed in files which don't have an import to trigger ES6 module usage

declare global {
  namespace Cypress {
    interface Chainable {
      alertTitleShouldContain(title: string): Chainable<Element>;
      clickNavLink(path: string[]): Chainable<Element>;
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
      checkErrors(): Chainable<Element>;
      waitUntilEnabled(selector: string): void;
    }
  }
}

Cypress.Commands.add('alertTitleShouldContain', (alertTitle: string) => {
  cy.byLegacyTestID('modal-title').should('contain.text', alertTitle);
});

Cypress.Commands.add('clickNavLink', (path: string[]) => {
  cy.get(`[data-component="pf-nav-expandable"]`) // this assumes all top level menu items are expandable
    .contains(path[0])
    .click(); // open top, expandable menu
  cy.get('#page-sidebar').contains(path[1]).click();
});

Cypress.Commands.add('selectByDropDownText', (selector: string, dropdownText: string) => {
  cy.get(selector).click();
  cy.get('li').contains(dropdownText).click({ force: true });
});

Cypress.Commands.add(
  'selectByAutoCompleteDropDownText',
  (selector: string, dropdownText: string) => {
    cy.get(selector).click();
    cy.byTestID('console-select-search-input').type(dropdownText);
    cy.get(`[id*="${dropdownText}-link"]`, { timeout: 60000 }).click({ force: true });
  },
);

Cypress.Commands.add('verifyDropdownselected', (selector: string) => {
  cy.get(selector).should('be.visible');
  cy.get(selector).click().get('[role="menu"]').should('be.visible');
});

Cypress.Commands.add('mouseHover', (selector: string) => {
  cy.get(selector).invoke('show').should('be.visible').trigger('mouseover', { force: true });
});

Cypress.Commands.add(
  'selectValueFromAutoCompleteDropDown',
  (selector: string, dropdownText: string) => {
    cy.get(selector).click();
    cy.byTestID('console-select-search-input').type(dropdownText);
    cy.byTestID('console-select-menu-list').find('li').contains(dropdownText).click();
  },
);

Cypress.Commands.add('selectActionsMenuOption', (actionsMenuOption: string) => {
  cy.byLegacyTestID('actions-menu-button').should('be.visible').click();
  app.waitForLoad();
  cy.byTestActionID(actionsMenuOption).should('be.visible').click();
});

Cypress.Commands.add('dropdownSwitchTo', (dropdownMenuOption: string) => {
  cy.byTestID('console-select-menu-toggle')
    .click()
    .find('data-test="console-select-item"')
    .contains(dropdownMenuOption)
    .click();
});

Cypress.Commands.add('isDropdownVisible', () => {
  cy.byTestID('console-select-menu-toggle')
    .should('be.visible')
    .click()
    .find('data-test="console-select-item"')
    .should('be.visible');
});

Cypress.Commands.add('checkErrors', () => {
  cy.get('body').then(($body) => {
    if (!$body) {
      return;
    }
    if ($body.find('[data-test-id="reset-button"]').length !== 0) {
      cy.get('body').then(($body1) => {
        if ($body1.find(formPO.errorAlert).length !== 0) {
          cy.get(formPO.errorAlert)
            .find('.co-pre-line')
            .then(($alert) => {
              cy.log(
                `Displaying following error: "${$alert.text()}", so closing this form or modal`,
              );
            });
        }
      });
      cy.byLegacyTestID('reset-button').click({ force: true });
    } else if ($body.find('[data-test-id="modal-cancel-action"]').length !== 0) {
      cy.get('body').then(($body2) => {
        if ($body2.find(formPO.errorAlert).length !== 0) {
          cy.get(formPO.errorAlert)
            .find('.co-pre-line')
            .then(($alert) => {
              cy.log(
                `Displaying following error: "${$alert.text()}", so closing this form or modal`,
              );
            });
        }
      });
      cy.byLegacyTestID('modal-cancel-action').click({ force: true });
      cy.get('body').then(($body1) => {
        if ($body1.find('[data-test-id="reset-button"]').length !== 0) {
          cy.byLegacyTestID('reset-button').click({ force: true });
        }
      });
    } else if ($body.find('button[aria-label="Close"]').length !== 0) {
      cy.get('button[aria-label="Close"]').click({ force: true });
    }
  });
});

Cypress.Commands.add('waitUntilEnabled', (selector: string, timeout: number = 20000): any => {
  const start = new Date().getTime();

  return cy.get(selector).then(($el) => {
    return new Promise((resolve, reject) => {
      const checkEnabled = () => {
        if ($el.is(':enabled')) {
          resolve($el);
        } else if (new Date().getTime() - start > timeout) {
          reject(new Error(`Timed out waiting for ${selector} to become enabled`));
        } else {
          setTimeout(checkEnabled, 100);
        }
      };

      checkEnabled();
    });
  });
});
