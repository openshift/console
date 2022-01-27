import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import {
  pageTitle,
  devNavigationMenu,
  addOptions,
} from '@console/dev-console/integration-tests/support/constants';
import {
  catalogPO,
  quickStartSidebarPO,
} from '@console/dev-console/integration-tests/support/pageObjects';
import {
  catalogPage,
  catalogInstallPageObj,
  topologyHelper,
  createHelmReleaseWithName,
  navigateTo,
  addPage,
  projectNameSpace,
  app,
} from '@console/dev-console/integration-tests/support/pages';

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
  createHelmReleaseWithName('Nodejs', 'nodejs-release');
  createHelmReleaseWithName('Quarkus', 'quarkus');
  navigateTo(devNavigationMenu.Add);
});

Then('user will get redirected to Helm Charts page', () => {
  detailsPage.titleShouldContain(pageTitle.HelmCharts);
});

Then('user will see the list of Chart Repositories', () => {
  catalogPage.verifyChartListAvailable();
});

Then('user will see the cards of Helm Charts', () => {
  catalogPage.verifyHelmChartCardsAvailable();
});

Then('user will see Filter by Keyword field', () => {
  catalogPage.verifyFilterByKeywordField();
});

Then('user will see A-Z, Z-A sort by dropdown', () => {
  catalogPage.verifySortDropdown();
});

Given('user is at Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

Given('user has applied namespaced CRD yaml {string}', (yamlFile: string) => {
  cy.exec(`oc apply -f ${yamlFile}`, { failOnNonZeroExit: false });
});

Given(
  'user has created namespaced helm chart repo with yaml {string} in namespace {string}',
  (yamlFile: string, namespace: string) => {
    cy.exec(`oc apply -f ${yamlFile} -n ${namespace}`, { failOnNonZeroExit: false });
  },
);

When('user selects Helm Chart card from Add page', () => {
  addPage.selectCardFromOptions(addOptions.HelmChart);
});

Then('user will see {string} under Chart repositories filter', (chartRepo: string) => {
  catalogPage.verifyChartRepoAvailable(chartRepo);
});

Then(
  'user will not see {string} under Chart repositories filter in a new namespace {string}',
  (chartRepo: string, namespace: string) => {
    projectNameSpace.selectOrCreateProject(namespace);
    catalogPage.verifyChartRepoNotAvailable(chartRepo);
  },
);

When('user clicks on quick start link in helm catalog description', () => {
  cy.get('[data-test-id="catalog-page-description"]>a')
    .should('be.visible')
    .click();
});

Then('user will see {string} quick start', (quickStartName: string) => {
  app.waitForDocumentLoad();
  cy.get(quickStartSidebarPO.quickStartSidebar)
    .should('be.visible')
    .should('contain', quickStartName);
});
