import { Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPO } from '../../page-objects/topology-po';

Then('user is able to see Start building your application, Add page links', () => {
  cy.get(topologyPO.emptyView.startBuildingYourApplicationLink).should('be.visible');
  cy.get(topologyPO.emptyView.addPageLink).should('be.visible');
});

Then('Display options dropdown, Filter by resource and Find by name fields are disabled', () => {
  cy.contains('Display options').should('be.disabled');
  cy.get(topologyPO.filterByResourceDropDown).should('be.disabled');
  cy.get(topologyPO.search).should('be.disabled');
});

Then('Zoom in, Zoom out, Fit to Screen, Reset view, layout icons are displayed', () => {
  cy.get(topologyPO.graph.zoomIn).should('be.visible');
  cy.get(topologyPO.graph.zoomOut).should('be.visible');
  cy.get(topologyPO.graph.fitToScreen).should('be.visible');
  cy.get(topologyPO.graph.reset).should('be.visible');
  cy.get(topologyPO.graph.layoutViewGroup).should('be.visible');
});

Then('switch view is disabled', () => {
  cy.get(topologyPO.switcher).should('have.attr', 'aria-disabled', 'true');
});
