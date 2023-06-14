import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import {
  resourceTypes,
  devNavigationMenu,
  nodeActions,
} from '@console/dev-console/integration-tests/support/constants';
import {
  createGitWorkloadIfNotExistsOnTopologyPage,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages';
import { createBroker } from '@console/dev-console/integration-tests/support/pages/functions/createBroker';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';

Given('user has created knative service {string}', (knativeServiceName: string) => {
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    knativeServiceName,
    resourceTypes.knativeService,
  );
});

Given('user created Broker {string}', (brokerName: string) => {
  createBroker(brokerName);
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user right clicks on the Broker {string} to open the context menu', (brokerName: string) => {
  topologyPage.rightClickOnNode(brokerName);
});

When('user clicks on the Add Trigger', () => {
  topologyPage.selectContextMenuAction(nodeActions.AddTrigger);
});

When('user will click on the Subscriber dropdown on the modal', () => {
  cy.get(topologyPO.graph.subscriber.dropdown).click();
});

Then(
  'Subscriber has knative service dropdown with {string} and {string} options',
  (option1: string, option2: string) => {
    cy.get("[role='listbox']").should('be.visible').and('contain', option1).and('contain', option2);
  },
);

When('user selects the auto populated name of subscription', () => {
  cy.get(topologyPO.graph.subscriber.filter).should('be.visible');
});

When('user selects the Subscriber {string}', (subscriberName: string) => {
  cy.get(topologyPO.graph.subscriber.filterItemLink).contains(subscriberName).click();
});

When('user clicks on Add button', () => {
  cy.get(topologyPO.graph.confirmModal).click();
});

Then('user will see connection between Broker and Subscriber', () => {
  cy.get(topologyPO.graph.triggerLink).should('be.visible');
});

Given('user is having Broker {string} on the Topology page', (brokerName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyWorkloadInTopologyPage(brokerName);
  cy.get(topologyPO.clearFilter).contains('Clear all filters').click({ force: true });
});

Given('user has already added the trigger', () => {
  cy.get(topologyPO.graph.triggerLink).should('be.visible');
});

When('user right clicks on the Trigger to open the context menu', () => {
  cy.get(topologyPO.graph.triggerLink).within(() => {
    cy.get(topologyPO.graph.triggerEdgeLink).trigger('contextmenu', { force: true });
  });
});

When('user clicks on the Move Trigger', () => {
  cy.get(topologyPO.graph.nodeContextMenu).contains('Move Trigger').click();
});

When('user clicks on the Delete Trigger', () => {
  cy.get(topologyPO.graph.nodeContextMenu).contains('Delete Trigger').click();
});

When('user clicks on the Delete button on the modal', () => {
  cy.get(topologyPO.graph.deleteWorkload).click();
});

Then('trigger will get deleted', () => {
  cy.get(topologyPO.graph.triggerLink).should('not.exist');
});

When('user selects the Subscriber {string} from dropdown', (subscriberName: string) => {
  cy.get(topologyPO.graph.subscriber.filterField).click();
  cy.get(topologyPO.graph.subscriber.filterText).type(subscriberName);
  cy.get(topologyPO.graph.subscriber.filterItemLink).eq(0).click();
  cy.get(topologyPO.graph.confirmModal).click();
});

Given('user is having knative service {string}', (serviceName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(serviceName);
  cy.get(topologyPO.clearFilter).contains('Clear all filters').click({ force: true });
});
