import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import * as yamlEditor from '@console/cypress-integration-tests/views/yaml-editor';
import {
  resourceTypes,
  devNavigationMenu,
  addOptions,
} from '@console/dev-console/integration-tests/support/constants';
import { eventSourcePO } from '@console/dev-console/integration-tests/support/pageObjects/add-flow-po';
import {
  createGitWorkloadIfNotExistsOnTopologyPage,
  addPage,
  navigateTo,
  createForm,
  eventSourcesPage,
} from '@console/dev-console/integration-tests/support/pages';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { createEventPage } from '../../pages/dev-perspective/eventing-page';

Given('user has created {string} knative service', (knativeServiceName: string) => {
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    knativeServiceName,
    resourceTypes.knativeService,
  );
});

When('user clicks on the Ping Source Event Source card', () => {
  cy.log('Ping Source Event Source created');
  eventSourcesPage.search('Ping Source');
  eventSourcesPage.clickEventSourceType('PingSource');
});

When('user clicks on the Event Source card on the Add page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.EventSource);
});

When('user clicks on the Create Event Source button on side bar', () => {
  cy.get(eventSourcePO.addButton)
    .contains('Create Event Source')
    .click({ force: true });
});

When('user selects Form view', () => {
  cy.get(eventSourcePO.formView).click();
});

When('user enters {string} in Schedule field', (scheduleField: string) => {
  cy.get(eventSourcePO.createPingSource.schedule).type(scheduleField);
});

When('user selects Resource radio button', () => {
  cy.get(eventSourcePO.createPingSource.resourceToggleButton).click();
});

When('user selects {string} as a resource', (resourceName: string) => {
  cy.get(eventSourcePO.createPingSource.resourceDropDownField).click();
  cy.get(eventSourcePO.createPingSource.resourceSearch).type(resourceName);
  cy.get(eventSourcePO.createPingSource.resourceDropDownItem)
    .eq(0)
    .click({ force: true });
});

When('user clicks on the Create button', () => {
  createForm.clickSave();
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('Topology page have the {string} Event Source created', (componentName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(componentName);
});

Given('user is at the Ping Source Create page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.EventSource);
  eventSourcesPage.search('Ping Source');
  eventSourcesPage.clickEventSourceType('PingSource');
  cy.get(eventSourcePO.addButton)
    .contains('Create Event Source')
    .click({ force: true });
});

When('user selects the YAML View', () => {
  cy.get(eventSourcePO.yamlView).click();
});

When('user does some valid changes in the yaml for Event Source', () => {
  yamlEditor.isLoaded();
  createEventPage.clearYAMLEditor();
  const yamlLocation = '../integration-tests/support/testData/createPingSource.yaml';
  cy.readFile(yamlLocation).then((str) => {
    yamlEditor.setEditorContent(str);
  });
});

Then("user will see that the data hasn't lost", () => {
  cy.get(eventSourcePO.createPingSource.data).should('have.value', 'Message');
  cy.get(eventSourcePO.createPingSource.schedule).should('have.value', '* * * * *');
  cy.get(eventSourcePO.createPingSource.name).should('have.value', 'ping-source-resource-event');
});
