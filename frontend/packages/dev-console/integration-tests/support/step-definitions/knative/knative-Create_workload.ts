import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage, seelctCardFromOptions, addPageObj, containerImage, catalogPage } from '../../pages/add_page';
import { addOptions } from '../../constants/add';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';
import { topologyPage } from '../../pages/topology_page';

Given('user is on {string} form', (formName: string) => {
  naviagteTo(devNavigationMenu.Add);
  seelctCardFromOptions(formName);
});

Given('builder images are displayed', () => {
  // TODO: implement step
});

When('user clicks on From git card', () => {
  seelctCardFromOptions(addOptions.Git);
});

When('user clicks on Container Image card', () => {
  seelctCardFromOptions(addOptions.ContainerImage);
});

When('user clicks on From Dockerfile card', () => {
  seelctCardFromOptions(addOptions.DockerFile);
});

When('user clicks on From Catalog card', () => {
  seelctCardFromOptions(addOptions.Catalog);
});

When('create the application with s2i builder image', () => {
  // TODO: implement step
});

When('user type {string} into the Git Repo url text box', (gitRepoUrl: string) => {
  addPage.enterGitUrl(gitRepoUrl);
});

When('user type {string} into the Image name from External registry text box', (imageName: string) => {
  containerImage.enterExternalRegistryImageName(imageName);
});

When('select {string} radio button on Add page', (resourceType: string) => {
 addPage.selectResource(resourceType)
});

When('click Create button on Add page', () => {
 addPage.clicKCreate();
});

When('user search and select the {string} card', (cardName: string) => {
 catalogPage.search(cardName);
});

When('create the application with the selected builder image', () => {
  // TODO: implement step
});

When('type name as {string}', (workloadName: string) => {
  addPage.enterComponentName(workloadName)
});

When('select the resource type {string} radio button on Add page', (optionName: string) => {
  addPage.selectResource(optionName);
});

Then('user redirects to page with header name {string}', (headerName: string) => {
  addPage.verifyTitle(headerName);
});

Then('Knaive Service option is displayed in Resources section', () => {
  cy.get(addPageObj.resources.knative).should('be.visible');
});

Then('created workload {string} is present in List View of topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});
