import { checkErrors } from '@console/cypress-integration-tests/support';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { installPipelinesOperatorUsingCLI } from '@console/dev-console/integration-tests/support/pages';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';

before(() => {
  const bridgePasswordIDP: string = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
  const bridgePasswordPassword: string = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
  cy.login(bridgePasswordIDP, bridgePasswordUsername, bridgePasswordPassword);
  cy.document().its('readyState').should('eq', 'complete');
  cy.exec(
    `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Enabled"}}]}}}'`,
    { failOnNonZeroExit: false },
  );
  cy.reload(true);
  cy.document().its('readyState').should('eq', 'complete');
  guidedTour.close();
  checkDeveloperPerspective();
  installPipelinesOperatorUsingCLI();
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
