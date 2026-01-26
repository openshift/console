import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';
import { installShipwrightOperatorUsingCLI } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnClusterUsingCLI';

before(() => {
  cy.exec('../../../../contrib/create-user.sh');
  cy.login();
  checkDeveloperPerspective();
  installShipwrightOperatorUsingCLI();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, { failOnNonZeroExit: false });
});

beforeEach(() => {
  cy.initDeveloper();
  // cy.initAdmin()
  // cy.byLegacyTestID('topology-header').should('exist').click({force: true});
});

afterEach(() => {
  cy.checkErrors();
});
