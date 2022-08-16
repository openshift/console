import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { addOptions } from '@console/dev-console/integration-tests/support/constants';
import {
  addPage,
  createKnativeKafka,
  topologyHelper,
} from '@console/dev-console/integration-tests/support/pages';
import { eventingPO } from '../../pageObjects/global-po';

Given(
  'user has created Knative Kafka instance with source enabled true in knative-eventing namespace',
  () => {
    createKnativeKafka();
  },
);

Given('user has created Kafka instance and Topics', () => {
  cy.get(eventingPO.kafka.amqStreams).click();
  cy.get(eventingPO.kafka.kafkaLink).click();
  cy.get(eventingPO.kafka.createItem).click();
  cy.get(eventingPO.kafka.resourceTitle).should('have.text', 'Create Kafka');
  cy.get(eventingPO.kafka.createForm).click();
  cy.get(eventingPO.kafka.filter).type('my-cluster');
  cy.get(eventingPO.kafka.status, { timeout: 120000 }).should('have.text', 'Ready');
  cy.get(eventingPO.kafka.kafkaTopicLink).click();
  cy.get(eventingPO.kafka.createItem).click();
  cy.get(eventingPO.kafka.createForm).click();
  cy.get(eventingPO.kafka.filter).type('my-topic');
  cy.get(eventingPO.kafka.status, { timeout: 120000 }).should('have.text', 'Ready');
});

When('user clicks on Event Source card', () => {
  addPage.selectCardFromOptions(addOptions.EventSource);
});

When('user clicks on Kafka Source', () => {
  cy.get(eventingPO.kafka.kafkaSource).click();
});

When('user clicks on Create Event Source on Kafka Source side pane', () => {
  cy.get(eventingPO.kafka.modalHeader)
    .contains('Create Event Source')
    .click({ force: true });
});

Then('user will see the items in BootStrapServers dropdown', () => {
  cy.get(eventingPO.kafka.bootstrapServerDropdown).click({ force: true });
  cy.get(eventingPO.kafka.dropdownList).should('have.prop', 'childElementCount', 2);
});

Then('user will see the items in Topics dropdown', () => {
  cy.get(eventingPO.kafka.topicsDropdown).click({ force: true });
  cy.get(eventingPO.kafka.dropdownList).should('have.prop', 'childElementCount', 4);
});

When('user selects multiple BootStrapServers', () => {
  cy.get(eventingPO.kafka.bootstrapServerDropdown).click();
  cy.get(eventingPO.kafka.bootstrapServer).should(
    'have.attr',
    'placeholder',
    'Add bootstrap servers',
  );
  cy.get(eventingPO.kafka.dropdownOptions, { timeout: 20000 }).should('have.length', 2);
  cy.get(eventingPO.kafka.dropdownOptions)
    .eq(0)
    .click();
  cy.get(eventingPO.kafka.dropdownOptions)
    .eq(1)
    .click();
  cy.get(eventingPO.kafka.bootstrapServerDropdown).click();
});

When('user selects multiple Topics', () => {
  cy.get(eventingPO.kafka.topicsDropdown).click();
  cy.get(eventingPO.kafka.dropdownOptions)
    .eq(0)
    .click();
  cy.get(eventingPO.kafka.dropdownOptions)
    .eq(1)
    .click();
  cy.get(eventingPO.kafka.topicsDropdown).click();
});

When('user enters consumer group name as {string}', (name: string) => {
  cy.byLegacyTestID('kafkasource-consumergroup-field')
    .clear()
    .type(name);
});

When('user verify that Target resource is selected', () => {
  cy.get(eventingPO.kafka.targetResource).should('include.text', 'nodejs-ex-git');
});

When('user verify that Application is selected', () => {
  cy.get(eventingPO.kafka.applicationName).should('include.text', 'nodejs-ex-git-app');
});

When('user enters Kafka Source name as {string}', (name: string) => {
  cy.byLegacyTestID('application-form-app-name')
    .clear()
    .type(name);
});

When('user clicks on Create button on EventSource page', () => {
  cy.byLegacyTestID('submit-button').click();
});

Then('user can see the Kafka source {string}', (name: string) => {
  topologyHelper.verifyWorkloadInTopologyPage(name);
});

When('user creates BootStrapServer name {string}', (name: string) => {
  cy.get(eventingPO.kafka.bootstrapServer).type(name);
  cy.get(eventingPO.kafka.dropdownOptions).click();
  cy.get(eventingPO.kafka.bootstrapServerDropdown).click();
});

When('user creates Topic name {string}', (name: string) => {
  cy.get(eventingPO.kafka.topics).type(name);
  cy.get(eventingPO.kafka.dropdownOptions).click();
  cy.get(eventingPO.kafka.topicsDropdown).click();
});
