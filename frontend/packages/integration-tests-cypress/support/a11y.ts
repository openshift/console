import 'cypress-jest-adapter';
import 'cypress-axe';
import { Result } from 'axe-core';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      logA11yViolations(violations: Result[], target: string): Chainable<Element>;
      testA11y(target: string, selector?: string): Chainable<Element>;
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

Cypress.Commands.add('testA11y', (target: string, selector?: string) => {
  cy.injectAxe();
  cy.configureAxe({
    rules: [
      { id: 'color-contrast', enabled: false }, // seem to be somewhat inaccurate and has difficulty always picking up the correct colors, tons of open issues for it on axe-core
      { id: 'focusable-content', enabled: false }, // recently updated and need to give the PF team time to fix issues before enabling
      { id: 'scrollable-region-focusable', enabled: false }, // recently updated and need to give the PF team time to fix issues before enabling
      { id: 'list', enabled: false }, // introduced in Cypress 6.0. fix devconsole's sidebar NavList UL to only have LI as direct child elements. see https://bugzilla.redhat.com/show_bug.cgi?id=1908772
    ],
  });
  a11yTestResults.numberChecks += 1;
  cy.checkA11y(
    selector,
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
