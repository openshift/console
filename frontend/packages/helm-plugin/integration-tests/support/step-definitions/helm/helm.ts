import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  pageTitle,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants';
import { catalogPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  catalogPage,
  catalogInstallPageObj,
  topologyHelper,
  createHelmReleaseWithName,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';

When('user selects YAML view', () => {
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  cy.get(catalogPO.installHelmChart.yamlView).click();
  cy.testA11y('Pipeline Builder page - YAML view');
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
  createHelmReleaseWithName('Nodejs Ex K v0.2.1', 'nodejs-example');
  createHelmReleaseWithName('Quarkus v0.0.3', 'quarkus');
  navigateTo(devNavigationMenu.Add);
});

Then('user will get redirected to Helm Charts page', () => {
  detailsPage.titleShouldContain(pageTitle.HelmCharts);
});

Then('user will see the list of Chart Repositories', () => {
  catalogPage.verifyChartListAvailable();
});

Then('user will see the cards of Helm Charts', () => {
  catalogPage.verifyChartCardsAvailable();
});

Then('user will see Filter by Keyword field', () => {
  catalogPage.verifyFilterByKeywordField();
});

Then('user will see A-Z, Z-A sort by dropdown', () => {
  catalogPage.verifySortDropdown();
});
