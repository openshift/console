import {
  app,
  navigateTo,
  perspective,
} from '@console/dev-console/integration-tests/support/pages/app';
import { nav } from '../../../../integration-tests-cypress/views/nav';
import {
  devNavigationMenu,
  operators,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import { perspectiveName } from '@console/dev-console/integration-tests/support/constants/staticText/global-text';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects/operators-po';
import { installOperator } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';
import { operatorsPage } from '@console/dev-console/integration-tests/support/pages/operators-page';
import { guidedTour } from '../../../../integration-tests-cypress/views/guided-tour';
import {
  createKnativeEventing,
  createKnativeServing,
} from '@console/dev-console/integration-tests/support/pages/functions/knativeSubscriptions';

before(() => {
  cy.login();
  cy.visit('');
  app.waitForDocumentLoaded();
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperator(operators.ServerlessOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.ServerlessOperator);
      createKnativeEventing();
      createKnativeServing();
    } else {
      cy.log('Serverless operator is installed in cluster');
    }
  });
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
});

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(perspectiveName.developer);
  navigateTo(devNavigationMenu.Add);
});
