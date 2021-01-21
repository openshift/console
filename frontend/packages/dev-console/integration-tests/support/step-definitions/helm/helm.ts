import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { catalogPage, catalogInstallPageObj } from '../../pages/add-flow/catalog-page';
import { topologyHelper } from '../../pages/topology/topology-helper-page';
import { createHelmReleasewithName } from '../../pages/functions/createHelmRelease';
import { pageTitle } from '../../constants/pageTitle';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { navigateTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';

When('user selects YAML view', () => {
  cy.get(catalogInstallPageObj.installHelmChart.yamlView).click();
});

When('user selects the Chart Version {string}', (chartVersion: string) => {
  catalogInstallPageObj.selectHelmChartVersion(chartVersion);
});

When(
  'user selects {string} button from Change Chart version confirmation dialog',
  (option: string) => {
    catalogInstallPageObj.selectChangeOfChartVersionDialog(option);
  },
);

When('user clicks on the Install button', () => {
  catalogPage.clickOnInstallButton();
});

Then('Topology page have the helm chart workload {string}', (nodeName: string) => {
  topologyHelper.verifyWorkloadInTopologyPage(nodeName);
});

When('user enters Release Name as {string}', (releaseName: string) => {
  catalogPage.enterReleaseName(releaseName);
});

Then('user will see the chart version dropdown', () => {
  catalogInstallPageObj.verifyChartVersionDropdownAvailable();
});

Then('user has added multiple helm charts repositories', () => {
  createHelmReleasewithName('Nodejs Ex K v0.2.1', 'nodejs-example');
  createHelmReleasewithName('Quarkus v0.0.3', 'quarkus');
  navigateTo(devNavigationMenu.Add);
});

Then('user will get redirected to Helm Charts page', () => {
  detailsPage.titleShouldContain(pageTitle.HelmCharts);
});

Then('user will see the list of Chart Repositories', () => {
  catalogInstallPageObj.verifyChartListAvailable();
});

Then('user will see the cards of Helm Charts', () => {
  catalogInstallPageObj.verifyChartCardsAvailable();
});

Then('user will see Filter by Keyword field', () => {
  catalogInstallPageObj.verifyFilterByKeywordField();
});

Then('user will see A-Z, Z-A sort by dropdown', () => {
  catalogInstallPageObj.verifySortDropdown();
});
