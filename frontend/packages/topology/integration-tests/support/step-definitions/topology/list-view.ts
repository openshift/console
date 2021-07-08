import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages/app';
import { topologyPO } from '../../page-objects/topology-po';

When('user clicks on List view button', () => {
  navigateTo(devNavigationMenu.Topology);
  if (cy.get(topologyPO.graph.emptyGraph)) {
    cy.get(topologyPO.switcher).click();
  } else {
    cy.log('You are already on List View');
  }
});

Then('user will see workloads are segregated by applications groupings', () => {
  cy.get(topologyPO.graph.applicationGroupingTitle).should('be.visible');
});
