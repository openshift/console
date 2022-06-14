import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { eventSourcePO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  createEventSourcePage,
  navigateTo,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';

Given(
  'user has sinked event source {string} to URI {string}',
  (eventSourceName: string, uri: string) => {
    createEventSourcePage.createSinkBindingWithURI(eventSourceName, uri);
  },
);

When('user right clicks on URI to open context menu', () => {
  cy.get(eventSourcePO.createSinkBinding.uriNode)
    .find(eventSourcePO.nodeHandler)
    .rightclick({ force: true });
});

Then('user is able to see a context menu with option {string}', (option: string) => {
  cy.byTestActionID(option).should('be.visible');
});

Then('user enters the uri as {string} in {string} modal', (uri: string, header: string) => {
  modal.modalTitleShouldContain(header);
  cy.byLegacyTestID('edit-sink-uri')
    .clear()
    .type(uri);
});

Then(
  'user will see that event source {string} is sinked with uri {string}',
  (eventSourceName: string, uri: string) => {
    cy.log(`${eventSourceName} is linked with ${uri}`);
    topologyPage.clickOnNode(eventSourceName);
    topologySidePane.verify();
    cy.get(`[href="${uri}"]`).should('be.visible');
  },
);

Given('user has sinked event source {string} to URI', (eventSourceName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
});

When('user right clicks on the event source', () => {
  cy.get(eventSourcePO.createSinkBinding.eventSourceNode)
    .find(eventSourcePO.nodeHandler)
    .rightclick({ force: true });
});

When('user clicks on the Move Sink option', () => {
  cy.get(eventSourcePO.createSinkBinding.moveSinkButton).click();
});

When('user selects sink to Resource option', () => {
  cy.get(eventSourcePO.createSinkBinding.resourceToggleButton).click();
});

When('user selects the resource from Select Resource dropdown', () => {
  cy.get(eventSourcePO.createSinkBinding.resourceDropDownField).click();
  cy.get(eventSourcePO.createSinkBinding.resourceSearchField).type('kn-event');
  cy.get(eventSourcePO.createSinkBinding.resourceDropDownItem)
    .eq(0)
    .click();
});

When('user clicks on Save button', () => {
  cy.get(eventSourcePO.createSinkBinding.createButton).click();
  modal.shouldBeClosed();
});

Then('user will see that event source is now connected to new resource', () => {
  cy.get(eventSourcePO.createSinkBinding.eventSourceNode).click();
  cy.byLegacyTestID('kn-event').should('be.visible');
});

Then('user will see that the already existed URI will get vanished', () => {
  cy.get(eventSourcePO.createSinkBinding.uriNode, { timeout: 0 }).should('not.exist');
});
