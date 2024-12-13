import './login';
import './project';
import './selectors';
import './nav';
import './resources';
import './i18n';
import { a11yTestResults } from './a11y';
import './admin';

declare global {
  namespace Cypress {
    interface Chainable {
      visitAndWait(
        url: string,
        options?: Partial<Cypress.VisitOptions>,
        selector?: string,
      ): Chainable<Element>;
    }
  }
}

Cypress.Cookies.debug(true);

Cypress.on('uncaught:exception', (err) => {
  console.error('Uncaught exception', err);
  return true; // test fails
});

Cypress.Commands.overwrite('log', (originalFn, message) => {
  cy.task('log', `      ${message}`, { log: false }); // log:false means do not log task in runner GUI
  originalFn(message); // calls original cy.log(message)
});

const waitForElementToExist = (selector: string) =>
  cy.get(selector, { timeout: 30000 }).should('exist');

Cypress.Commands.add('visitAndWait', (url, options, selector = '#content') => {
  if (url !== '/') {
    cy.visit('/');
    waitForElementToExist('#content');
  }

  cy.visit(url, options);
  waitForElementToExist(selector);
});

Cypress.Commands.add('clickNavLink', (path: string[]) => {
  cy.get('#page-sidebar')
    .contains(path[0])
    .then(($navItem) => {
      if ($navItem.attr('aria-expanded') !== 'true') {
        cy.wrap($navItem).click();
      }
    });
  if (path.length === 2) {
    cy.get('#page-sidebar').contains(path[1]).click();
  }
});

before(() => {
  cy.task('readFileIfExists', 'cypress-a11y-report.json').then((a11yReportOrNull: string) => {
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

export const checkErrors = () =>
  cy.window().then((win) => {
    assert.isTrue(!win.windowError, win.windowError);
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

const actionOnKind = (action: string, kind: string, humanizeKind: boolean) => {
  if (!humanizeKind) {
    return `${action} ${kind}`;
  }

  const humanizedKind = (kind.includes('~') ? kind.split('~')[2] : kind)
    .split(/(?=[A-Z])/)
    .join('');

  return `${action} ${humanizedKind}`;
};
export const editKind = (kind: string, humanizeKind: boolean) =>
  actionOnKind(actions.edit, kind, humanizeKind);
export const deleteKind = (kind: string, humanizeKind: boolean) =>
  actionOnKind(actions.delete, kind, humanizeKind);

export const create = (obj) => {
  const filename = [
    Cypress.config('screenshotsFolder').toString().replace('/cypress/screenshots', ''),
    `${obj.metadata.name}.${obj.kind.toLowerCase()}.json`,
  ].join('/');
  cy.writeFile(filename, JSON.stringify(obj));
  cy.exec(`oc create -f ${filename}`);
  cy.exec(`rm ${filename}`);
};
