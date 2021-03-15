import { navigateTo, perspective } from '@console/dev-console/integration-tests/support/pages/app';
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

before(() => {
  // login script is changed by console team, due to that unable to execute the scripts in local. So commenting below function until that issue is resolved
  // cy.login();
  cy.visit('');
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  cy.get(operatorsPO.installOperators.search)
    .should('be.visible')
    .clear()
    .type(operators.PipelinesOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.PipelinesOperator);
    } else {
      cy.log('Pipeline operator is installed in cluster');
    }
  });
});

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(perspectiveName.developer);
  navigateTo(devNavigationMenu.Add);
});
