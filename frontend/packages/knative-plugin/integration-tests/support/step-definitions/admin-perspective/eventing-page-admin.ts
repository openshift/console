import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { eventingPO } from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';

When('user selects Event Source', () => {
  cy.get(eventingPO.createEventSource).click();
});

When('user clicks on Ping Source', () => {
  cy.get(eventingPO.pingSource.create).click();
  cy.get(eventingPO.catalogSidebarCreateButton)
    .contains('Create Event Source')
    .click({ force: true });
});

When('user enters {string} in Data field', (dataField: string) => {
  cy.get(eventingPO.pingSource.dataField).type(dataField);
});

When('user enters {string} in Schedule field', (scheduleField: string) => {
  cy.get(eventingPO.pingSource.scheduleField).type(scheduleField);
});

When('user selects resource {string}', (resourceName: string) => {
  cy.get(eventingPO.pingSource.resource).click();
  cy.get(eventingPO.pingSource.resourceFilter).type(resourceName);
  cy.get(eventingPO.pingSource.resourceItem).click({ force: true });
});

When('user clicks on Create button to submit', () => {
  cy.get(eventingPO.pingSource.submit).click();
});

Then('user will be redirected to Project Details page', () => {
  cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
});

Then('user will see ping-source created', () => {
  cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
  cy.get(eventingPO.pingSource.details).should('be.visible');
});

When('user selects Channel', () => {
  cy.get(eventingPO.channel.createChannel).click();
});

When('user selects Default channels', () => {
  cy.get(eventingPO.channel.typeField).click();
  cy.get(eventingPO.channel.typeFieldMenu).contains('Default Channel').click();
});

Then('user will see channel created', () => {
  cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
  cy.get(eventingPO.channel.details).should('be.visible');
});

Given('user clicks on Create button to create channel', () => {
  cy.get(eventingPO.channel.submit).click();
});
