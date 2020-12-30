import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { catalogPage, catalogInstallPageObj } from '../../pages/add-flow/catalog-page';
import { topologyHelper } from '../../pages/topology/topology-helper-page';

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
