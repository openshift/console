import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage, topologySidePane, topologyObj } from '../../pages/topology_page';

When('user clicks on workload {string}', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({force: true});
});

Then('right sidebar opens with Resources tab selected by default', () => {
  topologySidePane.verifySelectedTab('Resources');
});

Then('user checks for sidebar tabs as Details, Resources and Monitoring', () => {
 topologySidePane.verifyTab('Resources');
 topologySidePane.verifyTab('Details');
 topologySidePane.verifyTab('Monitoring');
});

Then('user verifies name of the node {string} and Action menu present on top of the sidebar', (nodeName: string) => {
  topologySidePane.verifyTitle(nodeName);
  cy.byLegacyTestID('actions-menu-button').should('be.visible');
});

Then('user able to see health check notifiation', () => {
  cy.get('[role="dialog"] h4').contains('Health Checks').should('be.visible');
});

Then('user checks for close button on top right corner of sidebar', () => {
  cy.get(topologyObj.sidePane.close).should('be.visible');
});
