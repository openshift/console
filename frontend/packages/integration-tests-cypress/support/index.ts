import './login';
import './project';
import './selectors';
import './nav';
import './resources';

import { a11yTestResults } from './a11y';

Cypress.Cookies.defaults({
  preserve: ['openshift-session-token', 'csrf-token'],
});

Cypress.Commands.overwrite('log', (originalFn, message) => {
  cy.task('log', `      ${message}`, { log: false }); // log:false means do not log task in runner GUI
  originalFn(message); // calls original cy.log(message)
});

before(() => {
  cy.task('readFileIfExists', 'cypress-a11y-report.json').then((a11yReportOrNull) => {
    if (a11yReportOrNull !== null) {
      try {
        const a11yReport = JSON.parse(a11yReportOrNull);
        a11yTestResults.numberViolations = Number(a11yReport.numberViolations);
        a11yTestResults.numberChecks = Number(a11yReport.numberChecks);
        return;
      } catch (e) {
        cy.task('logError', `couldn't parse cypress-a11y-results.json.  ${e}`);
      }
    }
    a11yTestResults.numberViolations = 0;
    a11yTestResults.numberChecks = 0;
  });
});

after(() => {
  cy.writeFile('cypress-a11y-report.json', {
    numberChecks: `${a11yTestResults.numberChecks}`,
    numberViolations: `${a11yTestResults.numberViolations}`,
  });
});

const formatWindowError = (windowError: Error | PromiseRejectionEvent) => {
  if (!windowError) {
    return 'no window error detected';
  }
  const { reason } = windowError as PromiseRejectionEvent;
  if (reason) {
    return reason;
  }
  const { message, stack } = windowError as Error;
  const formattedStack = stack?.replace(/\\n/g, '\n');
  return `window error detected: ${message} ${formattedStack}`;
};

export const checkErrors = () =>
  cy.window().then((win) => {
    assert.isTrue(!win.windowError, formatWindowError(win.windowError));
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
