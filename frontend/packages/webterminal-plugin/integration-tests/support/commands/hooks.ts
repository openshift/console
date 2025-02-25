import { checkErrors } from '@console/cypress-integration-tests/support';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { installWebterminalOperatorUsingCLI } from '@console/dev-console/integration-tests/support/pages';

before(() => {
  cy.login();
  cy.document().its('readyState').should('eq', 'complete');
  guidedTour.close();
  installWebterminalOperatorUsingCLI();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.log(`Deleting "${namespaces.join(' ')}" namespace`);
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});

beforeEach(() => {
  cy.initDeveloper();
});

afterEach(() => {
  checkErrors();
});
