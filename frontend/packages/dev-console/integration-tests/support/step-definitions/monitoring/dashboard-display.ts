import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '../../constants/global';
import { monitoringPO } from '../../pageObjects/monitoring-po';
import { monitoringPage, topologyPage, navigateTo } from '../../pages';

Given('user opened the url of the workload {string} in topology page', (workloadName: string) => {
  topologyPage.clickWorkloadUrl(workloadName);
});

Given('user has workloads of all resource types', () => {
  // TODO: implement step
});

When('user navigates to Monitoring page', () => {
  navigateTo(devNavigationMenu.Observe);
});

When('user selects the workload {string} from the dropdown', (workloadName: string) => {
  monitoringPage.dashboard.selectWorkload(workloadName);
});

When('user clicks on Resources dropdown', () => {
  // TODO: implement step
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
  // TODO: implement step
});

When('user selects {string} from Types dropdown', (typeName: string) => {
  // TODO: implement step
  cy.log(typeName);
});

When('user enters {string} in the Filter field', (filterCriteria: string) => {
  // TODO: implement step
  cy.log(filterCriteria);
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
  // TODO: implement step
});

Then('user will see normal types of events', () => {
  // TODO: implement step
});

Then('user will see warning types of events', () => {
  // TODO: implement step
});

Then('user will see events having Scaled Up message', () => {
  // TODO: implement step
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
