import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import { eventSourcePO } from '@console/dev-console/integration-tests/support/pageObjects/add-flow-po';
import {
  app,
  navigateTo,
  perspective,
  topologyHelper,
  topologyPage,
} from '@console/dev-console/integration-tests/support/pages';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import { eventingPO } from '../../pageObjects';

When('user selects on {string} from {string} card', (eventName: string, addFlowCard: string) => {
  cy.get(eventingPO.broker.eventingCard).contains(addFlowCard);
  cy.get(eventingPO.broker.createEvent)
    .contains(eventName)
    .click();
});

When('user selects {string} from Actions drop down', (actionName: string) => {
  cy.get(eventingPO.broker.actionMenu).click();
  cy.get(eventingPO.broker.actionDropDown)
    .contains(actionName)
    .click();
});

When('user selects Form view', () => {
  cy.get(eventingPO.broker.formView).click();
});

When(
  'user enters broker name as {string} in application groupings {string}',
  (brokerName: string, appName: string) => {
    cy.get(eventingPO.broker.applicationGrouping.dropdown).click();
    cy.get(eventingPO.broker.applicationGrouping.create).click();
    cy.get(eventingPO.broker.applicationGrouping.formData)
      .clear()
      .type(appName);
    cy.get(eventingPO.broker.applicationGrouping.nameField)
      .clear()
      .type(brokerName);
  },
);

When('user clicks on Create button to create broker', () => {
  cy.get(eventingPO.broker.create).click();
});

Then('user will see the {string} broker created', (brokerName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(brokerName);
});

Given(
  'user has created broker {string} in application groupings {string}',
  (brokerName: string, groupName: string) => {
    navigateTo(devNavigationMenu.Topology);
    topologyPage.verifyWorkloadInTopologyPage(groupName);
    topologyPage.verifyWorkloadInTopologyPage(brokerName);
  },
);

When('user right clicks on {string} broker', (nodeName: string) => {
  cy.get(eventingPO.broker.topologyNode)
    .contains(nodeName)
    .trigger('contextmenu', { force: true });
});

Then('user will see option {string}', (optionName: string) => {
  cy.get(eventingPO.broker.sidebar.dropdownMenu)
    .contains(optionName)
    .should('be.visible');
});

When('user clicks on the {string} broker to open the sidebar', (nodeName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.clickOnNode(nodeName);
});

When('user selects Details tab', () => {
  cy.get(eventingPO.broker.sidebar.navBar)
    .contains('Details')
    .click();
});

Then('user will see name of broker as {string}', (brokerName) => {
  cy.get(eventingPO.broker.sidebar.resource).should('contain', brokerName);
});

Then('user will see namespace of broker as {string}', (namespaceName: string) => {
  cy.get(eventingPO.broker.sidebar.resource).should('contain', namespaceName);
});

Then('user will see labels and annotations associated with broker', () => {
  cy.get(eventingPO.broker.sidebar.labels).should('be.visible');
  cy.get(eventingPO.broker.sidebar.annotations).should('be.visible');
});

Then('user will see the owner and broker created time', () => {
  cy.get(eventingPO.broker.sidebar.createdAt).should('be.visible');
  cy.get(eventingPO.broker.sidebar.owners).should('be.visible');
});

When('user right click on the {string} broker to open the context menu', (brokerName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.rightClickOnNode(brokerName);
});

When('user clicks on {string}', (optionName: string) => {
  cy.get(eventingPO.broker.sidebar.dropdownMenu)
    .contains(optionName)
    .click();
});

When('user will click on Application drop down on the modal', () => {
  cy.get(eventingPO.broker.applicationGrouping.dropdown).click();
});

When('user selects {string} from Application drop down', (optionName: string) => {
  cy.get(eventingPO.broker.applicationGrouping.menu)
    .contains(optionName)
    .click();
});

When('user enters application name as {string}', (appName: string) => {
  cy.get(eventingPO.broker.applicationGrouping.nameForm).type(appName);
});

When('user clicks on Save button', () => {
  cy.get(topologyPO.graph.saveModal).click();
});

Then('user will see {string} application created', (appName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(appName);
});

When('user adds new label {string}', (labelName: string) => {
  cy.get(eventingPO.broker.label)
    .click()
    .type(labelName);
});

When('user clicks on the Save button on the modal', () => {
  cy.get(topologyPO.graph.saveModal).click();
  cy.get(topologyPO.graph.modalContent).should('not.exist');
  cy.reload();
  app.waitForLoad();
  perspective.switchTo(switchPerspective.Developer);
});

When('user enters name of trigger as {string}', (triggerName) => {
  cy.get(eventingPO.broker.sidebar.close).click({ force: true });
  cy.get(eventingPO.broker.sidebar.triggerName)
    .clear()
    .type(triggerName);
});

When('user selects {string} from Subscriber drop down', (subscriberName: string) => {
  cy.get(eventingPO.broker.sidebar.subscriberDropDown).click();
  cy.get(eventingPO.broker.sidebar.subscriberFilter).type(subscriberName);
  cy.get(eventingPO.broker.sidebar.subscriberItem)
    .eq(0)
    .click();
});

When('user clicks on Add button', () => {
  cy.get(eventingPO.broker.confirm).click();
});

Then('user will see {string} created', (triggerName) => {
  cy.reload();
  cy.get(topologyPO.resetView).click();
  cy.get(eventingPO.broker.topologyNode).click({ force: true });
  cy.get(eventingPO.broker.sidebar.navBar)
    .contains('Resources')
    .click();
  cy.get(eventingPO.broker.sidebar.resource, { timeout: 20000 })
    .contains(triggerName)
    .should('exist');
});

When('user selects Resources tab', () => {
  cy.get(eventingPO.broker.sidebar.navBar)
    .contains('Resources')
    .click();
});

Given('user has ping-source event source sinked to {string} broker', (brokerName: string) => {
  navigateTo(devNavigationMenu.Add);
  cy.get(eventingPO.createKnativeEvent).click();
  cy.get(eventingPO.pingSource.create).click();
  cy.get(eventingPO.createSidebar)
    .contains('Create Event Source')
    .click({ force: true });
  cy.get(eventingPO.pingSource.dataField).type('Message');
  cy.get(eventingPO.pingSource.scheduleField).type('* * * * *');
  cy.get(eventSourcePO.createPingSource.resourceToggleButton).click();
  cy.get(eventSourcePO.createPingSource.resourceDropDownField).click();
  cy.get(eventingPO.pingSource.resourceFilter).type(brokerName);
  cy.get(eventSourcePO.createPingSource.resourceDropDownItem)
    .eq(0)
    .click();
  cy.get(eventingPO.pingSource.save).click();
});

Then('user will see {string} under EventSources', (sourceName: string) => {
  cy.byLegacyTestID(sourceName).should('exist');
});

Then('user will see {string} under Subscribers', (subscriberName: string) => {
  cy.byLegacyTestID(subscriberName).should('exist');
});

Then('user will see Pods and Deployments section', () => {
  cy.get(eventingPO.broker.sidebar.heading)
    .should('contain', 'Pods')
    .and('contain', 'Deployments');
});

Then('user will not see {string} application', (appName: string) => {
  cy.get(eventingPO.broker.topologyNode)
    .contains('default-broker')
    .within(() => {
      cy.get(`[data-id="group:${appName}"]`, { timeout: 0 }).should('not.exist');
    });
});

Then('user will not see {string} broker', (brokerName: string) => {
  cy.reload();
  app.waitForLoad();
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Topology);
  topologyHelper.verifyWorkloadDeleted(brokerName);
});

When('user clicks on the Delete button on the modal', () => {
  cy.get(topologyPO.graph.deleteWorkload)
    .contains('Delete')
    .click();
});

Then('user will see the newly added label {string}', (labelName: string) => {
  cy.get(eventingPO.broker.labelList).should('contain', labelName);
});

When('user adds new annotation {string} and type {string}', (annotation: string, type: string) => {
  cy.get(eventingPO.broker.addAnnotations).click();
  cy.get('[placeholder="Key"]')
    .last()
    .type(annotation);
  cy.get('[placeholder="Value"]')
    .last()
    .type(type);
});

Then(
  'user will see the newly added annotation {string} and type {string}',
  (annotation: string, type: string) => {
    cy.get(eventingPO.broker.editAnnotations).click();
    cy.get(eventingPO.broker.annotationName).should('have.value', annotation);
    cy.get(eventingPO.broker.annotationValue).should('have.value', type);
  },
);
