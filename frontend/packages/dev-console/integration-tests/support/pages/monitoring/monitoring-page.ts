import { monitoringTabs } from '../../constants';
import { monitoringPO } from '../../pageObjects';

export const detailsPage = {
  isTabSelected: (tabSelector: string) =>
    cy.get(tabSelector).parent('li').should('have.class', 'active'),
  selectTab: (tabSelector: string) => cy.get(tabSelector).click(),
};

export const monitoringPage = {
  dashboard: {
    selectWorkload: (workloadName: string = 'All Workloads') => {
      cy.get(monitoringPO.dashboardTab.workloadsFilter).click();
      cy.byLegacyTestID('dropdown-text-filter').type(workloadName);
      cy.get(`[id="${workloadName}-link"]`).click();
    },
    selectDashboard: (dashboardName: string) => {
      cy.get(monitoringPO.dashboardTab.dashboardDropdown).click();
      cy.get('input[type="search"]').type(dashboardName);
      cy.get('button.monitoring-dashboards__dashboard_dropdown_item').first().click();
    },
    verifySection: () => cy.get(monitoringPO.dashboardTab.dashboard).should('exist'),
    verifyCpuUsageGraph: () => cy.get(monitoringPO.dashboardTab.sections.cpuUsage).should('exist'),
    verifyMemoryUsageGraph: () =>
      cy.get(monitoringPO.dashboardTab.sections.memoryUsage).should('exist'),
    verifyReceiveBandwidthGraph: () =>
      cy.get(monitoringPO.dashboardTab.sections.receiveBandwidth).should('exist'),
    verifyTransmitBandwidthGraph: () =>
      cy.get(monitoringPO.dashboardTab.sections.transmitBandwidth).should('exist'),
    verifyRateOfReceivedPacketsGraph: () =>
      cy.get(monitoringPO.dashboardTab.sections.rateOfReceivedPackets).should('exist'),
    verifyRateOfTransmittedPacketsGraph: () =>
      cy.get(monitoringPO.dashboardTab.sections.rateOfTransmittedPackets).should('exist'),
    verifyRateOfReceivedPacketsDroppedGraph: () =>
      cy.get(monitoringPO.dashboardTab.sections.rateOfReceivedPacketsDropped).should('exist'),
    verifyRateOfTransmittedPacketsDroppedGraph: () =>
      cy.get(monitoringPO.dashboardTab.sections.rateOfTransmittedPacketsDropped).should('exist'),
  },
  metrics: {
    enterQuery: (query: string) => {
      cy.get(monitoringPO.metricsTab.queryExpression).type(query);
    },
    selectQuery: (queryValue: string) => {
      cy.selectValueFromAutoCompleteDropDown(monitoringPO.metricsTab.selectQuery, queryValue);
    },
    verifyGraph: () => {
      cy.get(monitoringPO.metricsTab.cpuGraph).should('be.visible');
    },
    verifyResetZoom: () => cy.byButtonText('Reset Zoom').should('be.visible'),
    clickResetZoom: () => cy.byButtonText('Reset Zoom').click(),
  },
  events: {
    selectResources: (resourceName: string) => {
      cy.selectValueFromAutoCompleteDropDown(monitoringPO.eventsTab.resources, resourceName);
    },
    selectType: () => {
      cy.byLegacyTestID('dropdown-button').click();
      cy.get('#all-link').click();
      // To Do
    },
  },
  selectTab: (tabName: monitoringTabs | string) => {
    switch (tabName) {
      case 'Dashboard':
      case monitoringTabs.Dashboard:
        detailsPage.selectTab(monitoringPO.tabs.dashboard);
        cy.url().should('include', 'dev-monitoring/ns/');
        break;
      case 'Metrics':
      case monitoringTabs.Metrics:
        detailsPage.selectTab(monitoringPO.tabs.metrics);
        cy.url().should('include', 'metrics');
        break;
      case 'Events':
      case monitoringTabs.Events:
        detailsPage.selectTab(monitoringPO.tabs.events);
        cy.url().should('include', 'events');
        break;
      default:
        cy.log(`${tabName} is unable to click on monitoring page`);
        break;
    }
  },
};
