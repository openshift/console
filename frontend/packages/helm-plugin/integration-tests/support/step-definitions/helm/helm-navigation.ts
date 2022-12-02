import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import {
  devNavigationMenu,
  addOptions,
  pageTitle,
  switchPerspective,
  catalogTypes,
} from '@console/dev-console/integration-tests/support/constants';
import {
  catalogPO,
  helmChartRepositoriesPO,
} from '@console/dev-console/integration-tests/support/pageObjects/add-flow-po';
import {
  navigateTo,
  addPage,
  catalogPage,
  perspective,
  createForm,
} from '@console/dev-console/integration-tests/support/pages';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { helmPage, helmDetailsPage } from '../../pages';

const deleteChartRepositoryFromDetailsPage = (name: string, type: string) => {
  cy.log(`Deleting ${name}`);
  cy.byLegacyTestID('kebab-button').click();
  cy.byTestActionID(`Delete ${type}`).click();
  createForm.clickConfirm();
  cy.byTestID('no-repositories-found').should('be.visible');
};

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
});

When('user clicks on the Helm tab', () => {
  navigateTo(devNavigationMenu.Helm);
});

Then('user will be redirected to Helm releases page', () => {
  detailsPage.titleShouldContain('Helm');
});

Then('user is able to see the message {string}', (noHelmReleasesFound: string) => {
  helmPage.verifyMessage(noHelmReleasesFound);
});

Then('user will get the link to install helm charts from developer catalog', () => {
  helmPage.verifyInstallHelmLink();
});

Then('user is able to see the link {string}', (installLink: string) => {
  helmPage.verifyInstallHelmChartLink(installLink);
});

When('user searches and selects {string} card from catalog page', (cardName: string) => {
  catalogPage.search(cardName);
  catalogPage.selectHelmChartCard(cardName);
});

Then('Create Helm Release page is displayed', () => {
  cy.get('h1.pf-c-title').should('have.text', pageTitle.CreateHelmRelease);
});

Then('release name displays as {string}', (name: string) => {
  cy.get(catalogPO.installHelmChart.releaseName).should('have.value', name);
});

Given('user is at Create Helm Release page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.HelmChart);
  catalogPage.search('Nodejs');
  catalogPage.selectHelmChartCard('Nodejs');
  catalogPage.clickButtonOnCatalogPageSidePane();
});

Then('user is able to see YAML editor', () => {
  cy.get('div.view-lines').should('be.visible');
  cy.get(catalogPO.installHelmChart.cancel).click();
});

Then('Topology page have the helm chart workload {string}', (nodeName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(nodeName);
});

Given('user has installed helm chart', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyWorkloadInTopologyPage('nodejs-release');
});

Given('user is at the Helm page', () => {
  navigateTo(devNavigationMenu.Helm);
});

When('user selects checkbox for the Deployed Helm charts', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
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

Then(
  'user will see the Actions drop down menu with options Upgrade, Rollback, and Delete Helm Release',
  () => {
    helmDetailsPage.verifyActionsDropdown();
    helmDetailsPage.clickActionMenu();
    helmDetailsPage.verifyActionsInActionMenu();
  },
);

When('user clicks Actions menu in Helm Details page', () => {
  helmDetailsPage.clickActionMenu();
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

When('user selects {string} option from Type section', (catalogType: string) => {
  catalogPage.selectCatalogType(catalogType as catalogTypes);
});

Then('user can see {string} card on the Add page', (cardName: string) => {
  addPage.verifyCard(cardName);
});

Then('form view radio button is selected by default', () => {
  cy.get('#form-radiobutton-editorType-form-field').should('be.checked');
});

Then('yaml view radio button is enabled', () => {
  cy.get('#form-radiobutton-editorType-yaml-field').should('not.be.checked');
});

Then('form sections are displayed in form view', () => {
  // cy.get('#root_ingress_field-group').should('be.visible');
  // cy.get('#root_service_accordion-toggle').should('be.visible');
  // cy.get('#root_image_field-group').should('be.visible');
  // Only field group IDs are available with new chart.
  cy.get('#root_field-group').should('be.visible');
  cy.get(catalogPO.installHelmChart.cancel).click();
});

Then('user is redirected to Repositories tab', () => {
  detailsPage.titleShouldContain('Helm');
  helmDetailsPage.selectedHelmTab('Repositories');
});

Then('user is able to see Helm Releases and Repositories Tabs', () => {
  helmDetailsPage.checkHelmTab('Helm Releases');
  helmDetailsPage.checkHelmTab('Repositories');
});

When('user clicks on Repositories tab', () => {
  helmDetailsPage.selectHelmTab('Repositories');
});

Then(
  'user is able to see the Create drop down menu with Helm Release and Repository options',
  () => {
    helmDetailsPage.verifyHelmActionsDropdown();
    helmDetailsPage.clickHelmActionButton();
    helmDetailsPage.verifyActionsInCreateMenu();
  },
);

Then('user clicks on {string} repository', (repoName: string) => {
  helmDetailsPage.clickHelmChartRepository(repoName);
});

Then('Repositories breadcrumbs is visible', () => {
  detailsPage.breadcrumb(0).contains('Repositories');
});

Then('user clicks on Repositories link', () => {
  detailsPage.breadcrumb(0).click();
  detailsPage.titleShouldContain('Helm');
});

When('user clicks on Repository in create action menu to see the {string} form', (formName) => {
  helmDetailsPage.clickCreateRepository();
  cy.byTestID('form-title').contains(formName);
});

When('user clicks on Helm release in create action menu', () => {
  helmDetailsPage.clickCreateHelmRelease();
});

When('user enters Chart repository name as {string}', (name: string) => {
  cy.get(helmChartRepositoriesPO.name)
    .should('be.visible')
    .clear()
    .type(name);
});

When('user enters Description as {string}', (description: string) => {
  cy.get(helmChartRepositoriesPO.description)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(description);
});

When('user enters URL as {string}', (url: string) => {
  cy.get(helmChartRepositoriesPO.url)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(url);
});

When('user clicks on Create button', () => {
  createForm.clickCreate();
});

When(
  'user clicks on Save button to see the {string} {string} details page',
  (type: string, name: string) => {
    createForm.clickSave();
    cy.get(`[title=${type}`).should('be.visible');
    cy.byLegacyTestID('resource-title').contains(name);
  },
);

When('user enters Display name as {string}', (displayName: string) => {
  cy.get(helmChartRepositoriesPO.displayName)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(displayName);
});

Then(
  'user can see {string} {string} updated with {string} in the list page',
  (type: string, repoName: string, updatedValue: string) => {
    cy.byLegacyTestID('item-filter')
      .should('be.visible')
      .type(repoName);
    cy.wait(3000);
    cy.get('[data-test-rows="resource-row"]').contains(updatedValue);
    deleteChartRepositoryFromDetailsPage(repoName, type);
  },
);

When('user edits {string} {string}', (name: string, type: string) => {
  cy.byLegacyTestID('item-filter')
    .should('be.visible')
    .clear()
    .type(name);
  cy.wait(3000);
  cy.byLegacyTestID('kebab-button').click();
  cy.byTestActionID(`Edit ${type}`).click();
  cy.byTestID('form-title').contains(`Edit ${type}`);
});

When('user selects cluster-scoped scope type', () => {
  cy.get(`[data-test="HelmChartRepository-view-input"]`)
    .should('be.visible')
    .click();
});

When('user navigates to Helm page', () => {
  navigateTo(devNavigationMenu.Helm);
});

When('user can see {string} {string} details page', (type: string, name: string) => {
  cy.get(`[title=${type}`).should('be.visible');
  cy.byLegacyTestID('resource-title').contains(name);
});
