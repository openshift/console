import { Given } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '../../../../../integration-tests-cypress/views/nav';
import { operators, switchPerspective } from '../../constants/global';
import { perspectiveName } from '../../constants/staticText/global-text';
import { perspective } from '../../pages/app';
import { operatorsPage } from '../../pages/operators-page';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects/operators-po';
import { installOperator } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';

Given('user has installed Web Terminal operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  cy.get(operatorsPO.installOperators.search)
    .should('be.visible')
    .clear()
    .type(operators.WebTerminalOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.WebTerminalOperator);
    } else {
      cy.log('Serverless operator is installed in cluster');
    }
  });
});
