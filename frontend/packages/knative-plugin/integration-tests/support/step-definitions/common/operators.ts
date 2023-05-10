import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { operators } from '@console/dev-console/integration-tests/support/constants';
import {
  verifyAndInstallKnativeOperator,
  verifyAndInstallOperator,
} from '@console/dev-console/integration-tests/support/pages';

Given('user has installed OpenShift Serverless Operator', () => {
  verifyAndInstallKnativeOperator();
});

Given('user has installed OpenShift Pipelines Operator', () => {
  verifyAndInstallOperator(operators.PipelinesOperator);
});

Given('user has installed OpenShift Serverless Operator using CLI', () => {
  cy.exec(`oc apply -f installation-yamls/createKnativeServing-CR.yaml`, { timeout: 50000 })
    .its('stdout')
    .should('contain', 'subscription.operators.coreos.com/serverless-operator created');
});

When('user has created Knative Serving CR using CLI', () => {
  cy.exec(`oc apply -f testData/installation-yamls/createKnativeServing-CR.yaml`, {
    timeout: 10000,
  })
    .its('stdout')
    .should('contain', 'knativeserving.operator.knative.dev/knative-serving created');
});

When('user has created Knative Eventing CR using CLI', () => {
  cy.exec(`oc apply -f testData/installation-yamls/createKnativeEventing-CR.yaml`, {
    timeout: 10000,
  })
    .its('stdout')
    .should('contain', 'knativeeventing.operator.knative.dev/knative-eventing created');
});

When('user has created Knative Serving and Knative Eventing CR', () => {
  const servingYaml = 'support/testData/installation-yamls/createKnativeServing-CR.yaml';
  const eventingYaml = 'support/testData/installation-yamls/createKnativeEventing-CR.yaml';

  cy.exec(`oc apply -f ${servingYaml} -n ${Cypress.env('NAMESPACE')} `, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout);
  });

  cy.exec(`oc apply -f ${eventingYaml} -n ${Cypress.env('NAMESPACE')} `, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout);
  });
});
