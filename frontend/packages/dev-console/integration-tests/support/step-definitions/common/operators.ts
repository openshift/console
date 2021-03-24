import { Given } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { operators, switchPerspective, perspectiveName } from '../../constants';
import { perspective, operatorsPage, installOperator } from '../../pages';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects';

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
