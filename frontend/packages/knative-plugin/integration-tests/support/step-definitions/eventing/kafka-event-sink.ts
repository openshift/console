import { Given, And, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { addOptions, nodeActions } from '@console/dev-console/integration-tests/support/constants';
import {
  addPage,
  addSubscription,
  createChannel,
  sidePane,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';
import { createBroker } from '@console/dev-console/integration-tests/support/pages/functions/createBroker';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import { eventingPO } from '../../pageObjects';

And('user selects Event Sink card', () => {
  addPage.selectCardFromOptions(addOptions.EventSink);
});

And('user selects sinks provided by Red Hat', () => {
  cy.get(eventingPO.catalogProviderRedHat).click();
});

And('user switches to form view', () => {
  cy.byTestID('form-view-input').should('be.visible').click();
});

And('user creates a BootStrapServer as {string}', (serverName: string) => {
  cy.get(eventingPO.bootstrapServers).should('be.visible').clear().type(serverName).type('{enter}');
});

And('user creates a Topic as {string}', (name: string) => {
  cy.byTestID('kafkasink-topic-field').should('be.visible').clear().type(name);
});

And('user clicks on Create button for kafkasink form', () => {
  cy.get(eventingPO.submit).should('be.enabled').click();
});

And('user is at Topology Graph view', () => {
  topologyPage.verifyTopologyGraphView();
});

And('user has created KafkaSink {string} in topology', (name: string) => {
  topologyPage.verifyWorkloadInTopologyPage(name);
});

When(
  'user selects {string} context menu option of kafka sink {string}',
  (option: string, kafkaSinkName: string) => {
    topologyPage.rightClickOnNode(kafkaSinkName);
    topologyPage.selectContextMenuAction(option);
  },
);

When('user clicks Delete button on Delete modal', () => {
  modal.modalTitleShouldContain('Delete KafkaSink?');
  modal.submit();
  modal.shouldBeClosed();
});

Then('user will not see {string} in topology', (name: string) => {
  topologyPage.verifyWorkloadNotInTopologyPage(name, { timeout: 15000 });
});

Given('user has created Broker {string} in topology', (brokerName: string) => {
  createBroker(brokerName);
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

Given('user has created Channel {string} in topology', (channelName: string) => {
  createChannel(channelName);
});

When(
  'user right clicks on the Channel {string} to open the context menu',
  (channelName: string) => {
    topologyPage.rightClickOnNode(channelName);
  },
);

When('user selects {string} from Context Menu', (menuOption: string) => {
  topologyPage.selectContextMenuAction(menuOption);
});

When('user enters Name as {string} on Add Subscription modal', (subscriberName: string) => {
  modal.modalTitleShouldContain('Add Subscription');
  addSubscription.enterSubscriberName(subscriberName);
});

When('user selects Subscriber {string} on Add Subscription modal', (subscriber: string) => {
  addSubscription.selectKnativeService(subscriber);
});

When('user clicks on Add button', () => {
  modal.submit();
});

Then(
  'user will see connection between Channel {string} and Subscriber {string}',
  (channelName: string, subscriber: string) => {
    topologyPage.clickOnNode(channelName);
    topologySidePane.verify();
    cy.byLegacyTestID(subscriber).should('be.visible');
    sidePane.close();
  },
);

Then(
  'user will see that event source {string} is sinked with kafka sink {string}',
  (eventSourceName: string, kafkaSink: string) => {
    cy.log(`${eventSourceName} is linked with ${kafkaSink}`);
    topologyPage.clickOnNode(eventSourceName);
    topologySidePane.verify();
    topologySidePane.verifyResource(kafkaSink);
  },
);
