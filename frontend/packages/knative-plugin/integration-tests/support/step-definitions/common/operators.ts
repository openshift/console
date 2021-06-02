import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { verifyAndInstallKnativeOperator } from '@console/dev-console/integration-tests/support/pages';

Given('user has installed OpenShift Serverless Operator', () => {
  verifyAndInstallKnativeOperator();
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
