import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  addPage,
  gitPage,
  containerImagePage,
  catalogPage,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages';
import {
  addOptions,
  catalogCards,
  catalogTypes,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { gitPO } from '@console/dev-console/integration-tests/support/pageObjects';

Given('user is on {string} form', (formName: string) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(formName);
});

Given('builder images are displayed', () => {
  catalogPage.selectCatalogType(catalogTypes.BuilderImage);
});

When('user clicks on From git card', () => {
  addPage.selectCardFromOptions(addOptions.Git);
});

When('user enters S2I Git Repo url as {string}', (s2iGitRepoUrl: string) => {
  gitPage.enterGitUrl(s2iGitRepoUrl);
});

When('user clicks on Container Image card', () => {
  addPage.selectCardFromOptions(addOptions.ContainerImage);
});

When('user clicks on From Dockerfile card', () => {
  addPage.selectCardFromOptions(addOptions.DockerFile);
});

When('user clicks on From Catalog card', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('create the application with s2i builder image', () => {
  catalogPage.selectCatalogType('Builder Image');
  catalogPage.selectCardInCatalog(catalogCards.nodeJs);
  catalogPage.clickButtonOnCatalogPageSidePane();
});

When('user enters External registry image name as {string}', (imageName: string) => {
  containerImagePage.enterExternalRegistryImageName(imageName);
  containerImagePage.verifyValidatedMessage();
});

When('user enters Docker url as {string}', (dockerUrl: string) => {
  gitPage.enterGitUrl(dockerUrl);
  gitPage.verifyValidatedMessage();
});

When('user selects {string} radio button on Add page', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

When('user searches and selects the {string} card', (cardName: string) => {
  catalogPage.search(cardName);
});

When('user creates the application with the selected builder image', () => {
  catalogPage.selectCatalogType('Builder Image');
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
  cy.get(gitPO.resources.knative)
    .scrollIntoView()
    .should('be.visible');
});

Given('user is on Import from Docker file page', () => {
  addPage.selectCardFromOptions(addOptions.DockerFile);
});

When('user enters Image name from external registry as {string}', (imageName: string) => {
  containerImagePage.enterExternalRegistryImageName(imageName);
});

Given('user is at Deploy Image page', () => {
  addPage.selectCardFromOptions(addOptions.ContainerImage);
});
