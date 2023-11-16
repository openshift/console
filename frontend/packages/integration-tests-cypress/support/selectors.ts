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
      byTestActionID(selector: string): Chainable<JQuery<HTMLElement>>;
      byLegacyTestID(selector: string, timeout?: number): Chainable<JQuery<HTMLElement>>;
      byButtonText(selector: string): Chainable<JQuery<HTMLElement>>;
      byDataID(selector: string): Chainable<JQuery<HTMLElement>>;
      byTestSelector(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
      ): Chainable<JQuery<HTMLElement>>;
      byTestDropDownMenu(selector: string): Chainable<JQuery<HTMLElement>>;
      byTestOperatorRow(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
      ): Chainable<JQuery<HTMLElement>>;
      byTestSectionHeading(selector: string): Chainable<JQuery<HTMLElement>>;
      byTestOperandLink(selector: string): Chainable<JQuery<HTMLElement>>;
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
  cy.get(`[data-test-action="${selector}"]:not([disabled])`),
);

// deprecated!  new IDs should use 'data-test', ie. `cy.byTestID(...)`
Cypress.Commands.add('byLegacyTestID', (selector: string, timeout?: number) => {
  cy.get(`[data-test-id="${selector}"]`, { timeout });
});

Cypress.Commands.add('byButtonText', (selector: string) => {
  cy.get('button[type="button"]').contains(`${selector}`);
});

Cypress.Commands.add('byDataID', (selector: string) => {
  cy.get(`[data-id="${selector}"]`);
});

Cypress.Commands.add(
  'byTestSelector',
  (selector: string, options?: Partial<Loggable & Timeoutable & Withinable & Shadow>) => {
    cy.get(`[data-test-selector="${selector}"]`, options);
  },
);

Cypress.Commands.add('byTestDropDownMenu', (selector: string) => {
  cy.get(`[data-test-dropdown-menu="${selector}"]`);
});

Cypress.Commands.add('byTestOperatorRow', (selector: string, options?: object) => {
  cy.get(`[data-test-operator-row="${selector}"]`, options);
});

Cypress.Commands.add('byTestSectionHeading', (selector: string) => {
  cy.get(`[data-test-section-heading="${selector}"]`);
});

Cypress.Commands.add('byTestOperandLink', (selector: string) => {
  cy.get(`[data-test-operand-link="${selector}"]`);
});
