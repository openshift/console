import { monitoringTabs } from '../../constants';
import { monitoringPO } from '../../pageObjects';

export const detailsPage = {
  isTabSelected: (tabSelector: string) =>
    cy
      .get(tabSelector)
      .parent('li')
      .should('have.class', 'active'),
  selectTab: (tabSelector: string) => cy.get(tabSelector).click(),
};

export const monitoringPage = {
  dashboard: {
    selectWorkload: (workloadName: string = 'All Workloads') => {
      cy.get(monitoringPO.dashboardTab.workloadsFilter).click();
      cy.byLegacyTestID('dropdown-text-filter').type(workloadName);
      cy.get(`[id="${workloadName}-link"]`).click();
    },
    verifySection: () => cy.get(monitoringPO.dashboardTab.dashboard).should('be.visible'),
    verifyCpuUsageGraph: () => {},
    verifyMemoryUsageGraph: () => {},
    verifyReceiveBandwidthGraph: () => {},
    verifyTransmitBandwidthGraph: () => {},
    verifyRateOfReceivedPacketsGraph: () => {},
    verifyRateOfTransmittedPacketsGraph: () => {},
    verifyRateOfReceivedPacketsDroppedGraph: () => {},
    verifyRateOfTransmittedPacketsDroppedGraph: () => {},
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
  alerts: {
    search: (name: string) => {
      cy.byLegacyTestID('item-filter').type(name);
    },
    filter: (
      alertState: string[] = new Array('firing'),
      severity: string[] = new Array('Critical'),
    ) => {
      cy.byLegacyTestID('filter-dropdown-toggle')
        .find('button')
        .click();
      cy.get(`[data-test-row-filter="${alertState}"]`).click();
      //  To Do
      cy.byLegacyTestID(`[data-test-row-filter="${severity}"]`).click();
    },
    clickFilter: () =>
      cy
        .byLegacyTestID('filter-dropdown-toggle')
        .find('button')
        .click(),
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
      case 'Alerts':
      case monitoringTabs.Alerts:
        detailsPage.selectTab(monitoringPO.tabs.alerts);
        cy.url().should('include', 'alerts');
        break;
      default:
        cy.log(`${tabName} is unable to click on monitoring page`);
        break;
    }
  },
};
