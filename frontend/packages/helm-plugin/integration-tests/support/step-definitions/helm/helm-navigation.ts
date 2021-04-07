import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  navigateTo,
  addPage,
  catalogPage,
} from '@console/dev-console/integration-tests/support/pages';
import {
  devNavigationMenu,
  addOptions,
} from '@console/dev-console/integration-tests/support/constants';
import { helmPage, helmDetailsPage } from '../../pages';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { catalogPO } from '@console/dev-console/integration-tests/support/pageObjects/add-flow-po';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';

When('user clicks on the Helm tab', () => {
  navigateTo(devNavigationMenu.Helm);
});

Then('user will be redirected to Helm releases page', () => {
  detailsPage.titleShouldContain('Helm Releases');
});

Then('user is able to see the message as no helm charts present', () => {
  helmPage.verifyMessage();
});

Then('user will get the link to install helm charts from developer catalog', () => {
  helmPage.verifyInstallHelmLink();
});

Then('Install Helm Chart page is displayed', () => {
  cy.get('h1.pf-c-title').should('have.text', 'Install Helm Chart');
});

Then('release name displays as {string}', (name: string) => {
  cy.get(catalogPO.installHelmChart.releaseName).should('have.value', name);
  cy.get(catalogPO.installHelmChart.cancel).click();
});

Given('user is at Install Helm Chart page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.HelmChart);
  catalogPage.search('Nodejs Ex K v0.2.1');
  catalogPage.selectHelmChartCard('Nodejs Ex K v0.2.1');
  catalogPage.clickButtonOnCatalogPageSidePane();
});

Then('user is able to see YAML editor', () => {
  cy.get('div.view-lines').should('be.visible');
  cy.get(catalogPO.installHelmChart.cancel).click();
});

Then('Topology page have the helm chart workload {string}', (nodeName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(nodeName);
});

Given('helm chart is installed', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyWorkloadInTopologyPage('nodejs-example');
});

Given('user is at the Helm page', () => {
  navigateTo(devNavigationMenu.Helm);
});

When('user selects checkbox for the Deployed Helm charts', (workloadname: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadname);
});

When('user searches for a helm chart {string}', (helmChartName: string) => {
  helmPage.search(helmChartName);
});

Then('the helm chart {string} will be shown', (helmChartName: string) => {
  cy.log(helmChartName);
});

When('user clicks on the helm release name {string}', (helmChartName: string) => {
  helmPage.search(helmChartName);
  helmPage.clickHelmReleaseName(helmChartName);
});

Then('user will see the Details page opened', () => {
  helmDetailsPage.verifyTitle();
});

Then('user will see the Resources tab', () => {
  helmDetailsPage.verifyResourcesTab();
});

Then('user will see the Revision History tab', () => {
  helmDetailsPage.verifyRevisionHistoryTab();
});

Then('user will see the Release Notes tab', () => {
  helmDetailsPage.verifyReleaseNotesTab();
});

Then('user will see the Actions drop down menu', () => {
  helmDetailsPage.verifyActionsDropdown();
});

When('user clicks Actions menu in Helm Details page', () => {
  helmDetailsPage.clickActionMenu();
});

Then('Actions menu display with options Upgrade, Rollback, and Uninstall Helm Release', () => {
  helmDetailsPage.verifyActionsInActionMenu();
});

When('user clicks on the filter drop down', () => {
  helmPage.selectHelmFilterDropDown();
});

When('user selects checkbox for the {string} Helm charts', (status: string) => {
  helmPage.selectHelmFilter(status);
});

When('the checkbox for the {string} Helm chart is checked', (status: string) => {
  helmPage.verifyHelmFilterSelected(status);
});

When('helm charts with status {string} are listed', (status: string) => {
  helmPage.getItemFromReleaseTable(status);
});

When('user clicks on the clear all filters button', () => {
  helmPage.clearAllFilter();
});

Then(`{string} filters selected will get removed`, (status: string) => {
  helmPage.verifyHelmFilterUnSelected(status);
});

Then('user is able to see message on the Helm page as {string}', (message: string) => {
  helmPage.verifySearchMessage(message);
});

Then('user will see the helm charts listed', () => {
  helmPage.verifyHelmChartsListed();
});
