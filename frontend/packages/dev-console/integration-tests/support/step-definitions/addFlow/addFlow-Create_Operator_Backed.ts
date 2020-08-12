import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { catalogPage, catalogPageObj } from '../../pages/add_page';
import { topologyPage } from '../../pages/topology_page';

Given('Opeator Backed is selected on Developer Catalog page', () => {
  catalogPage.selectOperatorBackedCheckBox();
});

When('user selects knative Serving card', () => {
  catalogPage.selectKnativeServingCard();
});

When('click on Create button in side pane', () => {
  catalogPage.clickCreateButtonOnSidePane();
});

When('type name as {string} in Create Knative Serving page', (name: string) => {
  cy.get(catalogPageObj.createKnativeServing.logo).should('be.visible');
  cy.get(catalogPageObj.createKnativeServing.name).type(name);
});

When('user clicks create button in Create Knative Serving page', () => {
  cy.get(catalogPageObj.create).should('be.enabled').click();
});

When('user clicks cancel button in Create Knative Serving page', () => {
  cy.contains('Cancel').click();
});

Then('created workload {string} is present in topology page', (name: string) => {
  topologyPage.verifyWorkloadInTopologyPage(name);
});

