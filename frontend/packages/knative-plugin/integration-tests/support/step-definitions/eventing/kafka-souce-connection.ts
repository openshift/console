import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '@console/cypress-integration-tests/views/nav';
import {
  operators,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants';
import {
  perspective,
  verifyAndInstallOperator,
} from '@console/dev-console/integration-tests/support/pages';
import { eventingPO } from '../../pageObjects';

Given('user is at admin perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Administrator);
});

Given('user has created Kafka Connection {string}', () => {
  const yamlFile = 'support/testData/createKafkaConnection.yaml';
  cy.exec(`oc apply -f ${yamlFile} -n ${Cypress.env('NAMESPACE')} `, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout);
  });
});

Given('user has created Secret {string}', () => {
  const yamlFile = 'support/testData/createSecret.yaml';
  cy.exec(`oc apply -n ${Cypress.env('NAMESPACE')} -f ${yamlFile}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout);
  });
});

Given('user has installed RHOAS Operator', () => {
  verifyAndInstallOperator(operators.RHOAS);
});

When(
  'user selects the value of {string} Kafka Connection host url in Bootstrap servers field',
  (name: string) => {
    cy.get(eventingPO.kafka.bootstrapServer).type(name);
    cy.get(eventingPO.kafka.dropdownOptions).click();
    cy.get(eventingPO.kafka.bootstrapServerDropdown).click();
  },
);

When('user checks the Enable checkbox under SASL', () => {
  cy.get(eventingPO.kafkaSource.sasl).click();
});

When('user selects resource {string} under User', (resource: string) => {
  cy.get(eventingPO.kafkaSource.toggleText)
    .contains('Select a resource')
    .eq(0)
    .click({ force: true });
  cy.get(eventingPO.kafkaSource.dropdownInput).type(resource);
  cy.get(eventingPO.kafkaSource.rhSecret).click();
});

When('user selects key as {string} under User', (key: string) => {
  cy.get(eventingPO.kafkaSource.toggleText).contains('Select a key').eq(0).click({ force: true });
  cy.get(`#${key}-link`).click();
});

When('user selects resource {string} under Password', (resource: string) => {
  cy.get(eventingPO.kafkaSource.toggleText).contains('Select a resource').click({ force: true });
  cy.get(eventingPO.kafkaSource.dropdownInput).type(resource);
  cy.get(eventingPO.kafkaSource.rhSecret).click();
});

When('user selects key as {string} under Password', (key: string) => {
  cy.get(eventingPO.kafkaSource.toggleText).contains('Select a key').click({ force: true });
  cy.get(`#${key}-link`).click();
});

When('user checks the Enable checkbox under TLS', () => {
  cy.get(eventingPO.kafkaSource.tls).click();
});

When('user selects Resource under SinK as {string}', (name: string) => {
  cy.get(eventingPO.pingSource.resource).click();
  cy.get(eventingPO.pingSource.resourceFilter).type(name);
  cy.get(eventingPO.pingSource.resourceItem).click({ force: true });
});

When('user selects Application group as {string}', () => {
  cy.get(eventingPO.kafkaSource.appDropdown).click();
  cy.get(eventingPO.kafkaSource.noApp).click();
});

When('user enters Application Name as {string}', (name: string) => {
  cy.get(eventingPO.kafkaSource.appName).clear().type(name);
});

When('user clicks on Create button on form page', () => {
  cy.get(eventingPO.kafkaSource.submitBtn).click();
});

When(
  'user clicks on the connector connecting to kafka source {string} from kafka service {string}',
  () => {
    cy.get(eventingPO.kafkaSource.eventSourceLink).should('be.visible').click();
  },
);

Then(
  'user is able to see connection between kafka source {string} and knative service {string} from kafka connection {string}',
  () => {
    cy.get(eventingPO.kafkaSource.eventSourceLink).should('be.visible');
  },
);

Then(
  'user will see kafka source {string} and kafka service {string} under Connection in Resource tab of sidebar',
  () => {
    cy.get(eventingPO.kafkaSource.headingTitle).should('include.text', 'Event source connector');
    cy.get(eventingPO.kafkaSource.listItem).eq(0).should('include.text', 'kafka-source');
    cy.get(eventingPO.kafkaSource.listItem).eq(1).should('include.text', 'hello-openshift');
  },
);
