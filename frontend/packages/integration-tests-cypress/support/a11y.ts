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
  a11yTestResults.numberViolations += violations.length;

  cy.task(
    'log',
    `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${
      violations.length === 1 ? 'was' : 'were'
    } detected ${target ? `for ${target}` : ''}`,
  );

  // include violations in this log message
  violations.forEach((violation, index) => {
    cy.task(
      'log',
      `- ${index + 1}. ${violation.impact} ${violation.id}\n  ${violation.description.replace(
        '\n',
        '\n  ',
      )}\n  ${violation.help.replace(/\n/g, '\n  ')}\n  ${
        violation.helpUrl
      }\n  Tags: ${violation.tags.join(', ')}\n  ${
        violation.nodes.length === 1 ? 'Node' : 'Nodes:'
      }:`,
    );
    violation.nodes.forEach((node) => {
      cy.task(
        'log',
        `  - ${node.failureSummary.replace(/\n/g, '\n    ')}\n    HTML: ${node.html}${
          node.target ? `\n    Target: ${node.target.join(' ')}` : ''
        }${node.xpath ? `\n    XPath: ${node.xpath.join(' ')}` : ''}`,
      );
    });
  });

  // pluck specific keys to keep the table readable
  const violationData = violations.map(({ id, impact, description, nodes }) => ({
    impact,
    id,
    description,
    nodes: nodes.length,
  }));
  cy.task('logTable', violationData);
});

Cypress.Commands.add('testA11y', (target: string, selector?: string) => {
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
