import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  addOptions,
  catalogTypes,
} from '@console/dev-console/integration-tests/support/constants';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  addPage,
  eventSinkPage,
  navigateTo,
  createForm,
  gitPage,
  catalogPage,
  createEventSinkPage,
} from '@console/dev-console/integration-tests/support/pages';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';

When('user clicks on Event Sink card', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.EventSink);
});

When('user clicks on {string} card', (cardName: string) => {
  eventSinkPage.search(cardName);
  eventSinkPage.clickEventSourceType(cardName);
});

When('user clicks on Create Event Sink', () => {
  eventSinkPage.clickCreateEventSinkOnSidePane();
});

When('user selects Output Target as {string}', (target: string) => {
  createEventSinkPage.selectOutputTargetName(target);
});

When('user enters name as {string}', (name: string) => {
  gitPage.enterComponentName(name);
});

When('user clicks on Create button', () => {
  createForm.clickCreate();
});

Then('user will see {string} created in topology', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

Given('user is at catalog page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('user selects Types as Event Sinks', () => {
  catalogPage.selectCatalogType(catalogTypes.EventSinks);
});

When('user switches to YAML view', () => {
  cy.get('[id="form-radiobutton-editorType-yaml-field"]')
    .should('be.visible')
    .click();
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user right clicks in empty space of topology', () => {
  cy.get(topologyPO.graph.fitToScreen).should('be.visible');
  cy.get('[data-id="odc-topology-graph"]').rightclick('topLeft');
});

When('user selects {string} from Add to project', (option: string) => {
  cy.get(topologyPO.graph.contextMenuOptions.addToProject)
    .focus()
    .trigger('mouseover');
  cy.byTestActionID(option).click({ force: true });
});
