import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import { eventSourcePO } from '@console/dev-console/integration-tests/support/pageObjects';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { createBrokerIfNotExistsOnTopologyPage } from '@console/dev-console/integration-tests/support/pages/functions/createBroker';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';
import { eventingPO } from '../../pageObjects/global-po';

Given('user selects Broker from Developer Catalog card', () => {
  cy.get(eventingPO.brokerCard).click();
});

Given('user selects Event Source from Developer Catalog card', () => {
  cy.get(eventingPO.eventSourceCard).click();
});

Then('user will see Form view default selected', () => {
  cy.get(eventingPO.formView).should('be.checked');
});

Then('user will see YAML view radio button', () => {
  cy.get(eventingPO.yamlView).should('be.visible');
});

Then('user will see Application field for broker', () => {
  cy.byLegacyTestID('application-form-app-input').should('be.visible');
});

Then('user will see Name field for broker', () => {
  cy.byLegacyTestID('application-form-app-name').should('be.visible');
});

When('user selects YAML view', () => {
  cy.get(eventingPO.yamlView).should('be.visible').click();
});

When('user clicks on Create button to create broker', () => {
  cy.get(eventingPO.submit).click();
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('user will see the {string} broker created', (brokerName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(brokerName);
});

Given('user has created broker {string}', (brokerName: string) => {
  navigateTo(devNavigationMenu.Topology);
  createBrokerIfNotExistsOnTopologyPage(brokerName);
});

When('user selects {string} event source', (sourceType: string) => {
  cy.get(eventingPO.catlogTiles).contains(sourceType).click();
});

When('user clicks on Create Event Source button', () => {
  cy.get(eventingPO.createCatalog).contains('Create Event Source').click({ force: true });
});

When('user enters schedule as {string}', (schedule: string) => {
  cy.get(eventingPO.pingSource.dataField).type('Message');
  cy.get(eventingPO.pingSource.scheduleField).type(schedule);
});

When('user selects {string} broker from Resource dropdown', (brokerName: string) => {
  cy.get(eventSourcePO.createPingSource.resourceToggleButton).click();
  cy.get(eventSourcePO.createPingSource.resourceDropDownField).click();
  cy.get(eventSourcePO.createPingSource.resourceDropDownItem).contains(brokerName).click();
});

When('user enters name {string} of the PingSource event source', (name: string) => {
  cy.get(eventSourcePO.createPingSource.name).clear().type(name);
});

When('user clicks on the Create button', () => {
  cy.get(eventingPO.submit).click();
});

Then('user will see {string} event source created', (sourceName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(sourceName);
});

Then('user will see event source connected to broker', () => {
  cy.get(eventingPO.nodeLink).should('be.visible');
});

Given(
  'user has {string} event source sinked to {string} broker',
  (sourceName: string, brokerName: string) => {
    navigateTo(devNavigationMenu.Topology);
    topologyPage.verifyWorkloadInTopologyPage(sourceName);
    topologyPage.verifyWorkloadInTopologyPage(brokerName);
  },
);

When('user enters apiVersion', () => {
  cy.get(eventingPO.apiServerSource.apiVersionField).type('apiVersion');
});

When('user enters kind', () => {
  cy.get(eventingPO.apiServerSource.kindField).type('kind');
});

When('user enters name {string} of the EventSource event source', (name: string) => {
  cy.get(eventSourcePO.apiServerSource.name).clear().type(name);
});
