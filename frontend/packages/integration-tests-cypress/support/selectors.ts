/* eslint-disable @typescript-eslint/no-use-before-define */
import Loggable = Cypress.Loggable;
import Timeoutable = Cypress.Timeoutable;
import Withinable = Cypress.Withinable;
import Shadow = Cypress.Shadow;

export {};
declare global {
  namespace Cypress {
    interface Chainable {
      byTestID(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
      ): Chainable<Element>;
      byTestActionID(selector: string): Chainable<Element>;
      byLegacyTestID(selector: string): Chainable<Element>;
      byButtonText(selector: string): Chainable<Element>;
      byDataID(selector: string): Chainable<Element>;
      byTestSelector(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
      ): Chainable<Element>;
      byTestDropDownMenu(selector: string): Chainable<Element>;
      byTestOperatorRow(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
      ): Chainable<Element>;
      byTestSectionHeading(selector: string): Chainable<Element>;
      byTestOperandLink(selector: string): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add(
  'byTestID',
  (selector: string, options?: Partial<Loggable & Timeoutable & Withinable & Shadow>) => {
    cy.get(`[data-test="${selector}"]`, options);
  },
);

Cypress.Commands.add('byTestActionID', (selector: string) =>
  cy.get(`[data-test-action="${selector}"]:not(.pf-m-disabled)`),
);

// deprecated!  new IDs should use 'data-test', ie. `cy.byTestID(...)`
Cypress.Commands.add('byLegacyTestID', (selector: string) =>
  cy.get(`[data-test-id="${selector}"]`),
);

Cypress.Commands.add('byButtonText', (selector: string) =>
  cy.get('button[type="button"]').contains(`${selector}`),
);

Cypress.Commands.add('byDataID', (selector: string) => cy.get(`[data-id="${selector}"]`));

Cypress.Commands.add(
  'byTestSelector',
  (selector: string, options?: Partial<Loggable & Timeoutable & Withinable & Shadow>) =>
    cy.get(`[data-test-selector="${selector}"]`, options),
);

Cypress.Commands.add('byTestDropDownMenu', (selector: string) =>
  cy.get(`[data-test-dropdown-menu="${selector}"]`),
);

Cypress.Commands.add('byTestOperatorRow', (selector: string, options?: object) =>
  cy.get(`[data-test-operator-row="${selector}"]`, options),
);

Cypress.Commands.add('byTestSectionHeading', (selector: string) =>
  cy.get(`[data-test-section-heading="${selector}"]`),
);

Cypress.Commands.add('byTestOperandLink', (selector: string) =>
  cy.get(`[data-test-operand-link="${selector}"]`),
);
