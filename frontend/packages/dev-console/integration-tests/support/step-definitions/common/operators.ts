import { Given } from 'cypress-cucumber-preprocessor/steps';
import { operators } from '../../constants';
import {
  installPipelinesOperatorUsingCLI,
  installKnativeOperatorUsingCLI,
  installShipwrightOperatorUsingCLI,
  verifyAndInstallOperator,
  installWebterminalOperatorUsingCLI,
} from '../../pages';

Given('user has installed Web Terminal operator', () => {
  installWebterminalOperatorUsingCLI();
});

Given('user has installed OpenShift Serverless Operator', () => {
  installKnativeOperatorUsingCLI();
});

Given('user has installed OpenShift Pipelines Operator', () => {
  installPipelinesOperatorUsingCLI();
});

Given(
  '{operator} operator is installed on the cluster in {string} namespace',
  (operator: operators, namespace: string) => {
    cy.logout();
    cy.login(); // make sure we are logged in as kubeadmin
    verifyAndInstallOperator(operator, namespace);
  },
);

Given('user has installed Quay Container Security Operator', () => {
  verifyAndInstallOperator(operators.QuayContainerSecurity);
});

Given('user has installed Shipwright Operator', () => {
  installShipwrightOperatorUsingCLI();
});

Given('user with basic rights has installed Web Terminal operator', () => {
  installWebterminalOperatorUsingCLI();
});
