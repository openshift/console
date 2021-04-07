import { navigateTo, perspective } from '@console/dev-console/integration-tests/support/pages/app';
import {
  devNavigationMenu,
  operators,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects/operators-po';
import { installOperator } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';
import { operatorsPage } from '@console/dev-console/integration-tests/support/pages/operators-page';
import { guidedTour } from '../../../../integration-tests-cypress/views/guided-tour';

before(() => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperator(operators.PipelinesOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound).length) {
      installOperator(operators.PipelinesOperator);
    } else {
      cy.log('Pipeline operator is installed in cluster');
    }
  });
});

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  navigateTo(devNavigationMenu.Add);
});
