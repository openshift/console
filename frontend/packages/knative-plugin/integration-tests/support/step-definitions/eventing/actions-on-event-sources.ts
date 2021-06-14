import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { nodeActions } from '@console/dev-console/integration-tests/support/constants/topology';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { app } from '@console/dev-console/integration-tests/support/pages/app';
import { moveSink } from '@console/dev-console/integration-tests/support/pages/modal';
import {
  topologyPage,
  topologySidePane,
} from '@console/topology/integration-tests/support/pages/topology';

Given('knative service, event source and sink connector are present in topology page', () => {
  cy.get(topologyPO.graph.eventSourceWorkload).should('be.visible');
  cy.get(topologyPO.graph.knativeServiceNode).should('be.visible');
  cy.get(topologyPO.graph.eventSourceNode).should('be.visible');
});

When(
  'user right clicks on the event source {string} to open context menu',
  (eventSourceName: string) => {
    topologyPage.search(eventSourceName);
    topologyPage.rightClickOnNode(eventSourceName);
  },
);

When('user clicks on save', () => {
  modal.submit();
  modal.shouldBeClosed();
  cy.reload();
});

When('user selects {string} from context menu', (option: string) => {
  cy.byTestActionID(option).click();
});

Then(
  'user can see options Edit Application Groupings, Move Sink, Edit Labels, Edit Annotations, Edit SinkBinding, Delete SinkBinding',
  () => {
    cy.byTestActionID(nodeActions.EditApplicationGrouping).should('be.visible');
    cy.byTestActionID(nodeActions.MoveSink).should('be.visible');
    cy.byTestActionID(nodeActions.EditLabels).should('be.visible');
    cy.byTestActionID(nodeActions.EditAnnotations).should('be.visible');
    cy.byTestActionID(nodeActions.EditSinkBinding).should('be.visible');
    cy.byTestActionID(nodeActions.DeleteSinkBinding).should('be.visible');
  },
);

Then('user is able to see context menu', () => {
  cy.get('ul[role="menu"]').should('be.visible');
});

Then('modal displays with the header name {string}', (title: string) => {
  modal.modalTitleShouldContain(title);
});

When('user selects the Delete option on {string} modal', (modalTitle: string) => {
  modal.modalTitleShouldContain(modalTitle);
  modal.submit();
  app.waitForLoad();
});

Then('event source {string} will not be displayed in topology page', (eventSourceName: string) => {
  cy.get('[data-type="event-source"] text')
    .contains(eventSourceName)
    .should('not.be.visible');
});

Then('Resource dropdown is displayed in Move Sink modal', () => {
  moveSink.verifyResourceDropDown();
  modal.cancel();
});

When(
  'user selects the Resource {string} in {string} modal',
  (knativeService: string, header: string) => {
    modal.modalTitleShouldContain(header);
    moveSink.verifyResourceDropDown();
    moveSink.selectResource(knativeService);
  },
);

Then(
  'user will see that event source {string} is sinked with knative Service {string}',
  (eventSourceName: string, knativeService: string) => {
    cy.log(`${eventSourceName} is linked with ${knativeService}`);
    topologyPage.clickOnNode(eventSourceName);
    topologySidePane.verify();
    topologySidePane.verifyResource(knativeService);
  },
);

When('user closes the side bar', () => {
  topologySidePane.close();
});

When('user clicks save on Move Sink modal', () => {
  modal.submit();
});

When('user clicks on event source {string} to open side bar', (eventSourceName: string) => {
  topologyPage.search(eventSourceName);
  cy.get('[data-type="event-source"]')
    .eq(0)
    .click();
  topologySidePane.verify();
});

When('user selects {string} from side bar Action menu', (action: string) => {
  topologySidePane.selectNodeAction(action);
});

Then('user can see side bar with header name {string}', (headerName: string) => {
  topologySidePane.verifyTitle(headerName);
});
