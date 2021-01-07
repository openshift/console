import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';
import { helmPage, helmDetailsPage } from '../../pages/helm/helm-page';
import { addPage } from '../../pages/add-flow/add-page';
import { addOptions } from '../../constants/add';
import { topologyPage } from '../../pages/topology/topology-page';
import { catalogPage, catalogPageObj } from '../../pages/add-flow/catalog-page';

When('user clicks on the Helm tab', () => {
  naviagteTo(devNavigationMenu.Helm);
});

Then('user will be redirected to Helm releases page', () => {
  cy.pageTitleShouldContain('Helm Releases');
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
  cy.get(catalogPageObj.installHelmChart.releaseName).should('have.value', name);
  cy.get(catalogPageObj.installHelmChart.cancel).click();
});

Given('user is at Install Helm Chart page', () => {
  naviagteTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.HelmChart);
  catalogPage.search('Nodejs Ex K v0.2.1');
  catalogPage.selectHelmChartCard('Nodejs Ex K v0.2.1');
  catalogPage.clickButtonOnCatalogPageSidePane();
});

Then('user is able to see YAML editor', () => {
  cy.get('div.view-lines').should('be.visible');
  cy.get(catalogPageObj.installHelmChart.cancel).click();
});

Then('Topology page have the helm chart workload {string}', (nodeName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(nodeName);
});

Given('helm chart is installed', () => {
  naviagteTo(devNavigationMenu.Topology);
  topologyPage.verifyWorkloadInTopologyPage('nodejs-example');
});

Given('user is at the Helm page', () => {
  naviagteTo(devNavigationMenu.Helm);
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
