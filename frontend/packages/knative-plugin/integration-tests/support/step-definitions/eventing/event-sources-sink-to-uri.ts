import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  createEventSourcePage,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';

Given(
  'user has sinked event source {string} to URI {string}',
  (eventSourceName: string, uri: string) => {
    createEventSourcePage.createSinkBindingWithURI(eventSourceName, uri);
  },
);

When('user right clicks on URI {string} to open context menu', (uri: string) => {
  cy.get(`[href="${uri}"]`).trigger('contextmenu', { force: true });
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
