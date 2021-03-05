import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage } from '@console/dev-console/integration-tests/support/pages/topology/topology-page';
import { topologySidePane } from '@console/dev-console/integration-tests/support/pages/topology/topology-side-pane-page';
import { moveSink } from '@console/dev-console/integration-tests/support/pages/modal';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { app, navigateTo } from '@console/dev-console/integration-tests/support/pages/app';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects/topology-po';
import { nodeActions } from '@console/dev-console/integration-tests/support/constants/topology';

Given('knative service, event source and sink connector are present in topology page', () => {
  cy.get(topologyPO.graph.eventSourceWorkload).should('be.visible');
  cy.get('[data-type="knative-service"]').should('be.visible');
  cy.get('[data-type="event-source-link"]').should('be.visible');
});

When(
  'user right clicks on the event source {string} to open context menu',
  (eventSourceName: string) => {
    topologyPage.search(eventSourceName);
    cy.get(topologyPO.graph.node)
      .find('text')
      .first()
      .trigger('contextmenu', { force: true });
  },
);

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
  navigateTo(devNavigationMenu.Topology);
  topologyPage.search(eventSourceName);
  cy.get(topologyPO.graph.eventSourceWorkload).should('not.be.visible');
});

Then('Resource dropdown is displayed in Move Sink modal', () => {
  moveSink.verifyResourceDropDown();
  modal.cancel();
});

When(
  'user selects the knative service {string} from Resource dropdown',
  (knativeService: string) => {
    modal.modalTitleShouldContain('Move sink');
    moveSink.verifyResourceDropDown();
    moveSink.selectResource(knativeService);
  },
);

Then(
  'user will see that event source {string} is sinked with knative Service {string}',
  (eventSourceName: string, knativeService: string) => {
    cy.log(`${eventSourceName} is linked with ${knativeService}`);
    cy.get(topologyPO.graph.node)
      .find('text')
      .first()
      .click({ force: true })
      .then(() => {
        topologySidePane.verify();
        topologySidePane.verifyResource(knativeService);
      });
  },
);

When('user closes the side bar', () => {
  topologySidePane.close();
});

When('user clicks save on Move Sink modal', () => {
  modal.submit();
});
