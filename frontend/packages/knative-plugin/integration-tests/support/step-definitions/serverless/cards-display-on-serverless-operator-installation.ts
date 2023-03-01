import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import {
  devNavigationMenu,
  pageTitle,
} from '@console/dev-console/integration-tests/support/constants';
import { eventSourcePO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  addPage,
  eventSourcesPage,
  navigateTo,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages';

Then('user is able to see {string} card on Add page', (cardName: string) => {
  addPage.verifyCard(cardName);
});

When('user clicks on {string} Card', (cardName: string) => {
  addPage.selectCardFromOptions(cardName);
});

Then('user will be redirected to {string} page', (title: string) => {
  detailsPage.titleShouldContain(title);
});

Then('user can see knative Eventing card', () => {
  cy.byTestID('search-catalog').type('Knative Eventing');
  cy.byTestID('OperatorBackedService-Knative Eventing').should('be.visible');
});

When('user selects Add option from left side navigation menu', () => {
  navigateTo(devNavigationMenu.Add);
});

Then('user will be redirected to Add page', () => {
  cy.get('.ocs-page-layout__title').should('contain.text', pageTitle.Add);
});

When('user selects event source type {string}', (eventSourceType: string) => {
  const eventSourceT = eventSourceType.replace(/ /g, '');
  cy.log(eventSourceT);
  eventSourcesPage.clickEventSourceType(eventSourceT);
});

When('user selects Resource option in Target section', () => {
  cy.byTestID('uri-view-input', { timeout: 7000 }).should('be.checked');
  cy.get(eventSourcePO.sinkBinding.sink.resourceRadioButton).check();
});

Then('user is able to see notifier header {string}', (message: string) => {
  cy.get(eventSourcePO.sinkBinding.notifierHeader).should('contain.text', message);
});

Then('user can see message in sink section as {string}', (message: string) => {
  cy.get(eventSourcePO.sinkBinding.notifierMessage);
  cy.log(message);
});

Given('user is at namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(projectName);
});

When('user selects Create Event Source', () => {
  eventSourcesPage.clickCreateEventSourceOnSidePane();
});
