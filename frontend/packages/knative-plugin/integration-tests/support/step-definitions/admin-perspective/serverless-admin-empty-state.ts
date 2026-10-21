import { Then } from 'cypress-cucumber-preprocessor/steps';
import {
  eventingPO,
  servingPO,
} from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';

Then('user will see {string} message on Event Sources tab', (message: string) => {
  cy.get(eventingPO.eventSourcesTab).click();
  cy.get(eventingPO.message).should('contain.text', message);
});

Then('user will see {string} message on Brokers tab', (message: string) => {
  cy.get(eventingPO.brokersTab).click();
  cy.get(eventingPO.message).should('contain.text', message);
});

Then('user will see {string} message on Triggers tab', (message: string) => {
  cy.get(eventingPO.triggersTab).click();
  cy.get(eventingPO.message).should('contain.text', message);
});

Then('user will see {string} message on Channels tab', (message: string) => {
  cy.get(eventingPO.channelsTab).click();
  cy.get(eventingPO.message).should('contain.text', message);
});

Then('user will see {string} message on Subscriptions tab', (message: string) => {
  cy.get(eventingPO.subscriptionsTab).click();
  cy.get(eventingPO.message).should('contain.text', message);
});

Then('user will see {string} message on Services tab', (message: string) => {
  cy.get(servingPO.servicesTab).click();
  cy.get(eventingPO.message).should('contain.text', message);
});

Then('user will see {string} message on Revisions tab', (message: string) => {
  cy.get(servingPO.revisionsTab).click();
  cy.get(eventingPO.message).should('contain.text', message);
});

Then('user will see {string} message on Routes tab', (message: string) => {
  cy.get(servingPO.routesTab).click();
  cy.get(eventingPO.message).should('contain.text', message);
});

Then('user will see Create button', () => {
  cy.get(eventingPO.createEventDropDownMenu).contains('Create').should('exist');
});
