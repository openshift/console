import 'cypress-jest-adapter';
import 'cypress-axe';
import { Result } from 'axe-core';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      logA11yViolations(violations: Result[], target: string): Chainable<Element>;
      testA11y(target: string): Chainable<Element>;
    }
  }
}

export const a11yTestResults: a11yTestResultsType = {
  numberViolations: 0,
  numberChecks: 0,
};

Cypress.Commands.add('logA11yViolations', (violations: Result[], target: string) => {
  // pluck specific keys to keep the table readable
  const violationData = violations.map(({ id, impact, description, nodes }) => ({
    id,
    impact,
    description,
    nodes: nodes.length,
  }));
  a11yTestResults.numberViolations += violations.length;
  cy.task(
    'log',
    `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${
      violations.length === 1 ? 'was' : 'were'
    } detected ${target ? `for ${target}` : ''}`,
  );
  cy.task('logTable', violationData);
});

Cypress.Commands.add('testA11y', (target: string) => {
  cy.injectAxe();
  cy.configureAxe({
    rules: [
      { id: 'color-contrast', enabled: false }, // seem to be somewhat inaccurate and has difficulty always picking up the correct colors, tons of open issues for it on axe-core
      { id: 'focusable-content', enabled: false }, // recently updated and need to give the PF team time to fix issues before enabling
      { id: 'scrollable-region-focusable', enabled: false }, // recently updated and need to give the PF team time to fix issues before enabling
    ],
  });
  a11yTestResults.numberChecks += 1;
  cy.checkA11y(
    null,
    {
      includedImpacts: ['serious', 'critical'],
    },
    (violations) => cy.logA11yViolations(violations, target),
    false,
  );
});

type a11yTestResultsType = {
  numberViolations: number;
  numberChecks: number;
};
