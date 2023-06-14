import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import {
  addOptions,
  catalogCards,
  catalogTypes,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants';
import { gitPO, topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  addPage,
  gitPage,
  containerImagePage,
  catalogPage,
  navigateTo,
  topologyPage,
} from '@console/dev-console/integration-tests/support/pages';

Given('user is on {string} form', (formName: string) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(formName);
});

Given('builder images are displayed', () => {
  catalogPage.selectCatalogType(catalogTypes.BuilderImage);
});

When('user enters S2I Git Repo url as {string}', (s2iGitRepoUrl: string) => {
  gitPage.enterGitUrl(s2iGitRepoUrl);
});

When('user clicks on Container Image card', () => {
  addPage.selectCardFromOptions(addOptions.ContainerImage);
});

When('user clicks on From Catalog card', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('create the application with s2i builder image', () => {
  catalogPage.selectCatalogType(catalogTypes.BuilderImage);
  catalogPage.selectCardInCatalog(catalogCards.nodeJs);
  catalogPage.clickButtonOnCatalogPageSidePane();
});

When('user enters External registry image name as {string}', (imageName: string) => {
  containerImagePage.enterExternalRegistryImageName(imageName);
  containerImagePage.verifyValidatedMessage();
});

When('user enters Docker url as {string}', (dockerUrl: string) => {
  gitPage.enterGitUrl(dockerUrl);
  gitPage.verifyValidatedMessage(dockerUrl);
});

When('user selects {string} radio button on Add page', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

When('user searches and selects the {string} card', (cardName: string) => {
  catalogPage.search(cardName);
});

When('user creates the application with the selected builder image', () => {
  catalogPage.selectCatalogType(catalogTypes.BuilderImage);
  catalogPage.selectCardInCatalog(catalogCards.nodeJs);
  catalogPage.clickButtonOnCatalogPageSidePane();
});

When('user enters workload name as {string}', (workloadName: string) => {
  containerImagePage.enterAppName(workloadName);
});

Then('user will be redirected to page with header name {string}', (headerName: string) => {
  detailsPage.titleShouldContain(headerName);
});

Then('Knative Service option is displayed under Resources section', () => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(4000);
  cy.get(gitPO.resourcesDropdown).scrollIntoView().click();
  cy.get(gitPO.resources.knative).scrollIntoView().should('be.visible');
});

Given('user is on Import from Git form', () => {
  addPage.selectCardFromOptions(addOptions.ImportFromGit);
});

When('user enters Image name from external registry as {string}', (imageName: string) => {
  containerImagePage.enterExternalRegistryImageName(imageName);
});

Given('user is at Deploy Image page', () => {
  addPage.selectCardFromOptions(addOptions.ContainerImage);
});

When('user enters git url {string}', (url: string) => {
  gitPage.enterGitUrl(url);
});

When('user enters Docker URL as {string}', (url: string) => {
  gitPage.enterGitUrl(url);
});

When('user clicks on Import From Git option', () => {
  cy.get(topologyPO.grouping.importFromGitOption).click();
});

When('user clicks on Edit import strategy', () => {
  cy.get('.odc-import-strategy-section__edit-strategy-button').click();
});

When('user enters Git Repo URL as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage(gitUrl);
});

When('user clicks Import From Git card on the Add page', () => {
  addPage.selectCardFromOptions(addOptions.ImportFromGit);
});

When('user selects Import Strategy as Dockerfile', () => {
  cy.byTestID('import-strategy Dockerfile').click();
});

When('user enters Dockerfile path as {string}', (dockerfilePath: string) => {
  cy.get('#form-input-docker-dockerfilePath-field').clear().type(dockerfilePath);
});

When('user enters workload name as {string}', (name: string) => {
  gitPage.enterWorkloadName(name);
});

When('user selects resource type as {string}', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

When('user clicks Create button on Add page', () => {
  gitPage.clickCreate();
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});
