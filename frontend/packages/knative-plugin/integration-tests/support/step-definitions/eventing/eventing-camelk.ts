import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { app } from '@console/dev-console/integration-tests/support/pages';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import {
  topologyHelper,
  topologyPage,
} from '@console/topology/integration-tests/support/pages/topology';
import { eventingPO } from '../../pageObjects';
import { createCamelKSourceEvent } from '../../pages/dev-perspective/eventing-page';

Then('user is able to see multiple sources of the kind kamelets', () => {
  cy.get(eventingPO.catlogTiles).should('exist');
});

When('user clicks on Event Sources card', () => {
  cy.get(eventingPO.eventSourceCard).click();
});

Then('user will see the {string} card', (cardName: string) => {
  cy.byTestID(`EventSource-${cardName}`).should('exist');
});

When('user clicks on the {string} card', (cardName: string) => {
  cy.byTestID(`EventSource-${cardName}`).click();
  cy.get(eventingPO.createCatalog).contains('Create Event Source').click({ force: true });
});

When('user creates {string}', (eventName: string) => {
  createCamelKSourceEvent(eventName);
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('user will see {string} connector', (connectorName: string) => {
  topologyHelper.search(`kamelet-${connectorName}-source`);
  cy.get(topologyPO.graph.fitToScreen).click();
  cy.get(topologyPO.highlightNode).should('be.visible');
  cy.get(topologyPO.graph.reset).click();
  app.waitForDocumentLoad();
});
