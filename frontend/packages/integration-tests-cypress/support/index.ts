import './login';
import './project';
import './selectors';
import './nav';
import './resources';
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

Cypress.Cookies.defaults({
  preserve: ['openshift-session-token', 'csrf-token'],
});

Cypress.Commands.overwrite('log', (originalFn, message) => {
  cy.task('log', `      ${message}`, { log: false }); // log:false means do not log task in runner GUI
  originalFn(message); // calls original cy.log(message)
});

Cypress.Commands.add('logA11yViolations', (violations: Result[], target: string) => {
  // pluck specific keys to keep the table readable
  const violationData = violations.map(({ id, impact, description, nodes }) => ({
    id,
    impact,
    description,
    nodes: nodes.length,
  }));
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
  cy.checkA11y(
    null,
    {
      includedImpacts: ['serious', 'critical'],
    },
    (violations) => cy.logA11yViolations(violations, target),
    true,
  );
});

export const checkErrors = () =>
  cy.window().then((win) => {
    if (win.windowError) {
      throw new Error(`window/js runtime error detected: ${win.windowError}`);
    }
  });

export const testName = `test-${Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '')
  .substr(0, 5)}`;

export const actions = Object.freeze({
  labels: 'Edit Labels',
  annotations: 'Edit Annotations',
  edit: 'Edit',
  delete: 'Delete',
});

const actionOnKind = (action: string, kind: string) => {
  const humanizedKind = (kind.includes('~') ? kind.split('~')[2] : kind)
    .split(/(?=[A-Z])/)
    .join(' ');

  return `${action} ${humanizedKind}`;
};
export const editHumanizedKind = (kind: string) => actionOnKind(actions.edit, kind);
export const deleteHumanizedKind = (kind: string) => actionOnKind(actions.delete, kind);
