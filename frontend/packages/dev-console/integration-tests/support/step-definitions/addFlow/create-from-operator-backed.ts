import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { catalogTypes, addOptions, pageTitle, catalogCards } from '../../constants';
import { catalogPO } from '../../pageObjects';
import { catalogPage, addPage, topologyPage } from '../../pages';

const d = new Date();
const timestamp = d.getTime();

Given('Operator Backed is selected on Developer Catalog page', () => {
  catalogPage.selectCatalogType(catalogTypes.OperatorBacked);
});

Given('user is at OperatorBacked page', () => {
  addPage.selectCardFromOptions(addOptions.OperatorBacked);
});

When('user selects knative Serving card', () => {
  catalogPage.selectKnativeServingCard();
});

When('user clicks Create button in side bar', () => {
  catalogPage.clickButtonOnCatalogPageSidePane();
});

When('user enters name as {string} in Create knative Serving page', (name: string) => {
  cy.get(catalogPO.createKnativeServing.logo).should('be.visible');
  cy.get(catalogPO.createKnativeServing.name)
    .clear()
    .type(name);
});

When('user clicks create button in Create knative Serving page', () => {
  cy.get('button[type="submit"]').click();
});

When('user clicks cancel button in Create knative Serving page', () => {
  cy.get(catalogPO.createKnativeServing.logo).should('be.visible');
  cy.byButtonText('Cancel').click();
});

Then(
  'user is able to see workload {string} in topology page from knative Serving page',
  (name: string) => {
    topologyPage.verifyWorkloadInTopologyPage(`${name}-${timestamp}`);
  },
);

Then('user will be redirected to Developer Catalog page', () => {
  detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
});

When('user selects knative Kafka card', () => {
  catalogPage.selectCardInCatalog(catalogCards.knativeKafka);
});
