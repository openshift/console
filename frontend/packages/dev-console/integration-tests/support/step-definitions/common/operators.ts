import { Given } from 'cypress-cucumber-preprocessor/steps';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { operators, switchPerspective } from '../../constants';
import { perspective, operatorsPage, installOperator, verifyAndInstallOperator } from '../../pages';

Given('user has installed Web Terminal operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
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

Given('user has installed OpenShift Serverless Operator', () => {
  verifyAndInstallOperator(operators.ServerlessOperator);
});

Given('user has installed OpenShift Pipelines Operator', () => {
  verifyAndInstallOperator(operators.PipelinesOperator);
});

Given(
  '{operator} operator is installed on the cluster in {string} namespace',
  (operator: operators, namespace: string) => {
    cy.logout();
    cy.login(); // make sure we are logged in as kubeadmin
    verifyAndInstallOperator(operator, namespace);
  },
);
