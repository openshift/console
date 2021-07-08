import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import {
  devNavigationMenu,
  addOptions,
} from '@console/dev-console/integration-tests/support/constants';
import { eventSourcePO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  addPage,
  createEventSourcePage,
  eventSourcesPage,
  navigateTo,
  app,
  createForm,
  gitPage,
} from '@console/dev-console/integration-tests/support/pages';
import {
  topologyPage,
  topologySidePane,
} from '@console/topology/integration-tests/support/pages/topology';

Given('user is at Event Sources page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.EventSource);
});

When('user clicks on {string} card', (cardName: string) => {
  addPage.selectCardFromOptions(cardName);
});

When('user selects event source type {string}', (eventSourceType: string) => {
  eventSourcesPage.clickEventSourceType(eventSourceType);
});

Given('knative service is not available for selected namespace', () => {});

When('user selects Create Event Source', () => {
  eventSourcesPage.clickCreateEventSourceOnSidePane();
});

When('user enters Resource APIVERSION as {string}', (apiVersion: string) => {
  cy.get(eventSourcePO.apiServerSource.apiVersion)
    .should('be.visible')
    .type(apiVersion);
});

When('user enters Resource KIND as {string}', (version: string) => {
  cy.get(eventSourcePO.apiServerSource.kind)
    .should('be.visible')
    .type(version);
});

When(
  'user selects {string} option from Service Account Name field',
  (serviceAccountName: string) => {
    createEventSourcePage.selectServiceType(serviceAccountName);
  },
);

When('user selects {string} mode', (mode: string) => {
  createEventSourcePage.selectMode(mode);
});

When('user selects an {string} option from knative service field', (knativeService: string) => {
  createEventSourcePage.selectKnativeService(knativeService);
});

When('user clicks on Create button', () => {
  createForm.clickCreate();
});

When('user enters event source name as {string}', (eventSourceName: string) => {
  createEventSourcePage.enterEventSourceName(eventSourceName);
});

When('user enters Container Image as {string}', (containerImageName: string) => {
  cy.get(eventSourcePO.containerImage.image).type(containerImageName);
});

When('user enters schedule as {string}', (schedule: string) => {
  cy.get(eventSourcePO.pingSource.schedule).type(schedule);
});

When('user enters Subject apiVersion as {string}', (subjectApiVersion: string) => {
  cy.get(eventSourcePO.sinkBinding.apiVersion).type(subjectApiVersion);
});

When('user enters Subject Kind as {string}', (subjectKind: string) => {
  cy.get(eventSourcePO.sinkBinding.kind).type(subjectKind);
});

When('user enters Name as {string} in General section', (name: string) => {
  gitPage.enterComponentName(name);
});

Then('user will be redirected to page with header name {string}', (title: string) => {
  detailsPage.titleShouldContain(title);
});

Then(
  'user is able to see event sources like ApiServerSource, ContainerSource, CronJobSource, PingSource, SinkBinding',
  () => {
    app.waitForLoad();
    eventSourcesPage.verifyEventSourceType('Api Server Source');
    eventSourcesPage.verifyEventSourceType('Container Source');
    eventSourcesPage.verifyEventSourceType('Ping Source');
    eventSourcesPage.verifyEventSourceType('Sink Binding');
  },
);

Then('user is able to see {string} event source type', (eventSourceType: string) => {
  eventSourcesPage.verifyEventSourceType(eventSourceType);
});

Then('user is able to see knative Eventing card', () => {
  addPage.verifyCard('Knative Eventing');
});

Then('user is able to see notifier header {string}', (message: string) => {
  cy.get(eventSourcePO.sinkBinding.notifierHeader).should('contain.text', message);
});

When('user selects Resource option in Sink section', () => {
  cy.get(eventSourcePO.sinkBinding.sink.resourceRadioButton).check();
});

When('user selects the resource {string} for event source', (resource: string) => {
  createEventSourcePage.selectKnativeService(resource);
});

When('user enters the event source name {string}', (eventSourceName: string) => {
  createEventSourcePage.enterEventSourceName(eventSourceName);
});

Then('user can see message as {string}', (message: string) => {
  gitPage.verifyNoWorkLoadsText(message);
});

When('user clicks on the Create button', () => {
  createForm.clickCreate();
});

Then('user can see message in sink section as {string}', (message: string) => {
  cy.get(eventSourcePO.sinkBinding.notifierMessage);
  cy.log(message);
});

Then('sink has knative service dropdown with default text {string}', (text: string) => {
  cy.log(text);
});

Then(
  'Application Name, Name fields have default text as {string}, {string}',
  (appName: string, name: string) => {
    cy.log(appName, name);
  },
);

Then(
  'Application Name, Name fields will have default text as {string}, {string}',
  (appName: string, name: string) => {
    cy.log(appName, name);
  },
);

Then(
  'ApiServerSource event source {string} is created and linked to selected knative service {string}',
  (eventSource: string, resourceName: string) => {
    topologyPage.getEventSource(eventSource).click({ force: true });
    topologySidePane.verifyResource(resourceName);
  },
);

Then(
  'ContainerSource event source {string} is created and linked to selected knative service {string}',
  (eventSource: string, resourceName: string) => {
    topologyPage.getEventSource(eventSource).click({ force: true });
    topologySidePane.verifyResource(resourceName);
  },
);

Then(
  'CronJobSource event source {string} is created and linked to selected knative service {string}',
  (eventSource: string, resourceName: string) => {
    topologyPage.getEventSource(eventSource).click({ force: true });
    topologySidePane.verifyResource(resourceName);
  },
);

Then(
  'PingSource event source {string} is created and linked to selected knative service {string}',
  (eventSource: string, resourceName: string) => {
    topologyPage.getEventSource(eventSource).click({ force: true });
    topologySidePane.verifyResource(resourceName);
  },
);

Then(
  'SinkBinding event source {string} is created and linked to selected knative service {string}',
  (eventSource: string, resourceName: string) => {
    topologyPage.getEventSource(eventSource).click({ force: true });
    topologySidePane.verifyResource(resourceName);
  },
);

Then(
  'CamelSource event source {string} is created and linked to selected knative service {string}',
  (eventSource: string, resourceName: string) => {
    topologyPage.getEventSource(eventSource).click({ force: true });
    topologySidePane.verifyResource(resourceName);
  },
);

Then(
  'user will see the event source {string} is sinked with selected resource {string}',
  (eventSourceName: string, resourceName: string) => {
    topologyPage.verifyWorkloadInTopologyPage(resourceName);
    topologyPage.clickOnNode(eventSourceName);
    topologySidePane.verify();
    topologySidePane.verifyTab('Resources');
    cy.byLegacyTestID(resourceName).should('be.visible');
  },
);

When('user selects {string} option under Sink section', () => {
  createEventSourcePage.selectSinkOption('URI');
});

When('user enters uri as {string}', (uri: string) => {
  createEventSourcePage.enterURI(uri);
});
