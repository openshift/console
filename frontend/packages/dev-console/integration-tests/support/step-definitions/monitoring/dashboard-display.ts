import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { resourceTypes } from '../../constants';
import { devNavigationMenu } from '../../constants/global';
import { monitoringPO } from '../../pageObjects/monitoring-po';
import {
  monitoringPage,
  topologyPage,
  navigateTo,
  createGitWorkloadIfNotExistsOnTopologyPage,
} from '../../pages';

Given('user opened the url of the workload {string} in topology page', (workloadName: string) => {
  topologyPage.clickWorkloadUrl(workloadName);
});

Given('user has workloads of all resource types', () => {
  const name = 'observe-nodejs';
  const app = 'observe-nodejs-app';
  const url = 'https://github.com/sclorg/nodejs-ex';
  createGitWorkloadIfNotExistsOnTopologyPage(url, `${name}-d`, resourceTypes.Deployment, app);
  createGitWorkloadIfNotExistsOnTopologyPage(
    url,
    `${name}-dc`,
    resourceTypes.DeploymentConfig,
    app,
  );
});

When('user navigates to Monitoring page', () => {
  navigateTo(devNavigationMenu.Observe);
});

When('user selects the workload {string} from the dropdown', (workloadName: string) => {
  monitoringPage.dashboard.selectWorkload(workloadName);
});

When('user clicks on Resources dropdown', () => {
  cy.contains('.pf-c-select__toggle', 'Resources').click();
});

When('user selects {string}', (resourceType: string) => {
  cy.get('.pf-m-search')
    .clear()
    .type(resourceType);
  cy.contains('.co-resource-item__resource-name', resourceType).click();
});

When('user selects Service', () => {
  // TODO: implement step
});

When('user selects Deployment', () => {
  // TODO: implement step
});

When('user selects DeploymentConfig', () => {
  // TODO: implement step
});

When('user clicks on Types dropdown', () => {
  cy.get('[data-test="type-dropdown"]').click();
});

When('user selects {string} from Types dropdown', (typeName: string) => {
  cy.contains('.pf-c-dropdown__menu-item', typeName).click();
});

When('user enters {string} in the Filter field', (filterCriteria: string) => {
  cy.byLegacyTestID('item-filter')
    .clear()
    .type(filterCriteria);
});

Then('user will see Dashboard, Metrics, Alerts, Events tabs', () => {
  cy.get(monitoringPO.tabs.dashboard).should('be.visible');
  cy.get(monitoringPO.tabs.metrics).should('be.visible');
  cy.get(monitoringPO.tabs.alerts).should('be.visible');
  cy.get(monitoringPO.tabs.events).should('be.visible');
});

Then('user will see the dropdown selected with All Workloads by default', () => {
  cy.get(monitoringPO.dashboardTab.workloadsFilter).should('contain.text', 'All Workloads');
});

Then('user will see the CPU Usage on Metrics tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.cpuUsage)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Memory Usage on Metrics tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.memoryUsage)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see Receive Bandwidth on Metrics tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.receiveBandwidth)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see Transmit Bandwidth on Metrics tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.transmitBandwidth)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Rate of Received Packets on Metrics tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.rateOfReceivedPackets)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Rate of Transmitted Packets on Metrics tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.rateOfTransmittedPackets)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Rate of Received Packets Dropped on Metrics tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.rateOfReceivedPacketsDropped)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Rate of Transmitted Packets Dropped on Metrics tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.rateOfTransmittedPacketsDropped)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see events related to all resources and all types', () => {
  cy.get(monitoringPO.eventsTab.selectedResource).should('contain.text', 'All');
  cy.get(monitoringPO.eventsTab.types).should('contain.text', 'All types');
});

Then('user will see events for Service, Deployment and DeploymentConfig type resources', () => {
  cy.get('.co-m-loader').should('not.exist');
  cy.get('.co-sysevent').each((element) => {
    cy.wrap(element)
      .find('.sr-only')
      .first()
      .invoke('text')
      .should('be.oneOf', ['Service', 'Deployment', 'DeploymentConfig']);
  });
});

Then('user will see {string} types of events', (type: string) => {
  // TODO: implement step
  cy.log(type);
});

Then('user will see events having Scaled Up message', () => {
  cy.contains('.co-sysevent', 'Scaled up').should('have.length.at.least', 1);
});

Then('user is able to see Name, Severity, Alert State and Notifications', () => {
  cy.get(monitoringPO.alertsTab.table).should('be.visible');
  cy.get(monitoringPO.alertsTab.alertsTable.columns.name).should('be.visible');
  cy.get(monitoringPO.alertsTab.alertsTable.columns.severity).should('be.visible');
  cy.get(monitoringPO.alertsTab.alertsTable.columns.notifications).should('be.visible');
  cy.get(monitoringPO.alertsTab.alertsTable.columns.alertState).should('be.visible');
});

Then('user will see the CPU Usage on Dashboard tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.cpuUsage)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Memory Usage on Dashboard tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.memoryUsage)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see Receive Bandwidth on Dashboard tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.receiveBandwidth)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see Transmit Bandwidth on Dashboard tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.transmitBandwidth)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Rate of Received Packets on Dashboard tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.rateOfReceivedPackets)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Rate of Transmitted Packets on Dashboard tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.rateOfTransmittedPackets)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Rate of Received Packets Dropped on Dashboard tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.rateOfReceivedPacketsDropped)
    .scrollIntoView()
    .should('be.visible');
});

Then('user will see the Rate of Transmitted Packets Dropped on Dashboard tab', () => {
  cy.get(monitoringPO.dashboardTab.sections.rateOfTransmittedPacketsDropped)
    .scrollIntoView()
    .should('be.visible');
});

Given('user is on Observe page', () => {
  navigateTo(devNavigationMenu.Observe);
});

When('user clicks on Dashboard tab', () => {
  cy.get(monitoringPO.tabs.dashboard)
    .should('be.visible')
    .click();
});

When('user clicks on Dashboard dropdown', () => {
  cy.get(monitoringPO.dashboardTab.dashboardFilter)
    .should('be.visible')
    .click();
});

When('user can see {string} and {string} option', (option1: string, option2: string) => {
  // Uncommented after story ODC-6340 is implemented
  // cy.get('.pf-c-select__menu')
  //   .should('contain', option1)
  //   .and('contain', option2);
  cy.log(option1, option2); // to avoid lint issues
});

function chartTitleToTestId(chartTitle: string): string {
  return chartTitle.toLowerCase().replace(/\s+/g, '-');
}

Then('user will see {string} chart', (chartTitle: string) => {
  cy.get(`[data-test="${chartTitle.toLowerCase().replace(/\s+/g, '-')}-chart"]`)
    .scrollIntoView()
    .should('be.visible')
    // also wait for the chart to load
    .find('.co-m-loader')
    .should('not.exist');
});

Then('user will see {string} charts', (chartsGroup: string) => {
  cy.get(
    `[data-test-id="panel-${chartsGroup
      .toLowerCase()
      .replace(/\)/, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, '-')}"]`,
  )
    .scrollIntoView()
    .should('be.visible')
    .find('.co-m-loader')
    .should('not.exist');
});

When('user clicks on Workload dropdown', () => {
  cy.get(monitoringPO.dashboardTab.workloadsDropdown).click();
});

When('user clicks on Dashboard dropdown', () => {
  cy.get(monitoringPO.dashboardTab.dashboardDropdown).click();
});

When('user clicks on Type dropdown', () => {
  cy.get(monitoringPO.dashboardTab.typeDropdown).click();
});

When('user clicks on Pod dropdown', () => {
  cy.get(monitoringPO.dashboardTab.podDropdown).click();
});

When('user selects {string} option from the dropdown', (workloadName: string) => {
  cy.contains('.pf-c-select__menu-item', workloadName).click();
});

When('user selects the first option from the dropdown', () => {
  cy.get('.pf-c-select__menu-item')
    .first()
    .click();
});

When('user clicks on Inspect on {string} chart', (chartTitle: string) => {
  cy.get(`[data-test="${chartTitleToTestId(chartTitle)}-chart"]`)
    .find(`.co-dashboard-card__link`)
    .click();
});

Then('user will see Metrics tab in Observe page', () => {
  cy.get('.co-m-horizontal-nav-item--active')
    .find(monitoringPO.tabs.metrics)
    .should('be.visible');
});

Then('{string} option selected by default', (metric) => {
  cy.get(monitoringPO.metricsTab.selectQuery).should('contain.text', metric);
});
