import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { monitoringPO, topologyPO } from '../../pageObjects';
import { topologyPage, topologySidePane } from '../../pages';

When('user selects the workload {string} to open the topology sidebar', (workloadName: string) => {
  topologyPage.clickOnNode(workloadName);
});

When('user navigates to observe dashboard from toplogy sidebar', () => {
  topologySidePane.selectTab('Observe');
  cy.get(topologyPO.sidePane.monitoringTab.viewMonitoringDashBoardLink).click({ force: true });
});

Then('user is able to see the workload {string} in workloads dropdown', (workloadName: string) => {
  cy.get(monitoringPO.dashboardTab.workloadsDropdown).should('contain.text', workloadName);
});

Then('user is still able to see the same workload {string}', (workloadName: string) => {
  cy.get(monitoringPO.dashboardTab.workloadsDropdown).should('contain.text', workloadName);
});
