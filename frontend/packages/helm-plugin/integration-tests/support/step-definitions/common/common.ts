import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { nav } from '@console/cypress-integration-tests/views/nav';
import {
  devNavigationMenu,
  switchPerspective,
  catalogCards,
  catalogTypes,
} from '@console/dev-console/integration-tests/support/constants';
import {
  navigateTo,
  perspective,
  projectNameSpace,
  topologyPage,
  topologySidePane,
  gitPage,
  catalogPage,
  addPage,
} from '@console/dev-console/integration-tests/support/pages';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  // cy.testA11y('Developer perspective with guider tour modal');
});

Given('user is at administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyTopologyPage();
});

Given('user is at the Topology page in admin view', () => {
  cy.byLegacyTestID('topology-header').should('exist').click({ force: true });
  topologyPage.verifyTopologyPage();
});

When('user enters Git Repo url as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage(gitUrl);
});

When('user creates the application with the selected builder image', () => {
  catalogPage.selectCatalogType(catalogTypes.BuilderImage);
  catalogPage.selectCardInCatalog(catalogCards.nodeJs);
  catalogPage.clickButtonOnCatalogPageSidePane();
});

When('user enters name as {string} in General section', (name: string) => {
  gitPage.enterComponentName(name);
});

When('user selects resource type as {string}', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

When('user clicks Create button on Add page', () => {
  gitPage.clickCreate();
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

When('user clicks node {string} to open the side bar', (name: string) => {
  topologyPage.componentNode(name).click({ force: true });
});

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Then('modal with {string} appears', (header: string) => {
  modal.modalTitleShouldContain(header);
});

When('user clicks on workload {string}', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
});

When('user selects {string} card from add page', (cardName: string) => {
  addPage.selectCardFromOptions(cardName);
});

Given('user is at Software Catalog page', () => {
  cy.byLegacyTestID('developer-catalog-header').should('exist').click({ force: true });
});

When('user selects Helm Charts type from Software Catalog page', () => {
  catalogPage.selectCatalogType(catalogTypes.HelmCharts);
});

When('user switches to the {string} tab', (tab: string) => {
  topologySidePane.selectTab(tab);
});

When('user clicks on the link for the {string} of helm release', (resource: string) => {
  topologySidePane.selectResource(resource, Cypress.env('NAMESPACE'), 'nodejs-release');
});

Given('user is at Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

Given('user has logged in as admin user', () => {
  cy.login();
  perspective.switchTo(switchPerspective.Administrator);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Administrator);
});
