import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { servingPO } from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';

When('user selects Event Source', () => {
  cy.get(servingPO.createService).click();
});

When('user clicks on Create button to create service', () => {
  cy.get(servingPO.create).click();
});

Then('user will be redirected to Service Details page', () => {
  cy.get(servingPO.pageDetails).should('include.text', 'Service details');
});

Then('user can see {string} knative service created', (serviceName: string) => {
  cy.get(servingPO.resourceName).should('include.text', serviceName);
});

When('user clicks on Services tab', () => {
  cy.get(servingPO.servicesTab).click();
});

When('user clicks on Routes tab', () => {
  cy.get(servingPO.routesTab).click();
});

Then('user will see Search by name field', () => {
  cy.get(servingPO.filter.Toolbar).within(() => {
    cy.get(servingPO.filter.TypeMenu).click();
    cy.get(servingPO.filter.Type)
      .contains('Name')
      .click();
  });
});

Then('user can see knative service name {string}', (filterName: string) => {
  cy.get(servingPO.filter.Input).type(filterName);
});

Then('user can see kebab button', () => {
  cy.get(servingPO.kebabButton).should('be.visible');
});

When('user clicks on Revisions tab', () => {
  cy.get(servingPO.revisionsTab).click();
});

When('user clicks on Service button', () => {
  cy.get(servingPO.createService).click();
});

Then('user can see titles URL, Generation, Created, Conditions, Ready, Reason', () => {
  cy.get('[role="rowgroup"]')
    .should('contain', 'URL')
    .and('contain', 'Generation')
    .and('contain', 'Created')
    .and('contain', 'Conditions')
    .and('contain', 'Ready')
    .and('contain', 'Reason');
});

Then('user can see titles Namespace, Service, Created, Conditions, Ready, Reason', () => {
  cy.get('[role="rowgroup"]')
    .should('contain', 'Name')
    .and('contain', 'Service')
    .and('contain', 'Created')
    .and('contain', 'Conditions')
    .and('contain', 'Ready')
    .and('contain', 'Reason');
});

Then('user can see titles URL, Created, Conditions, Traffic', () => {
  cy.get('[role="rowgroup"]')
    .should('contain', 'URL')
    .and('contain', 'Created')
    .and('contain', 'Conditions')
    .and('contain', 'Traffic');
});
