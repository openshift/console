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

Then('switch view is disabled', () => {
  cy.get(topologyPO.switcher).should('have.attr', 'aria-disabled', 'true');
});
