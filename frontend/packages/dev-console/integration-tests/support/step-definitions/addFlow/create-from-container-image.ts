import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add-flow/add-page';
import { containerImagePage } from '../../pages/add-flow/container-image-page';
import { addOptions } from '../../constants/add';
import { topologyPage } from '../../pages/topology/topology-page';
import { gitPage } from '../../pages/add-flow/git-page';
import { gitPO } from '../../pageObjects/add-flow-po';

Given('user is at Deploy Image page', () => {
  addPage.selectCardFromOptions(addOptions.ContainerImage);
});

When('user enters Image name from external registry as {string}', (imageName: string) => {
  containerImagePage.enterExternalRegistryImageName(imageName);
});

Then('git url gets Validated', () => {
  gitPage.verifyValidatedMessage();
});

Then('user can see the image name gets Validated', () => {
  containerImagePage.verifyValidatedMessage();
});

Then('application name displays as {string}', (appName: string) => {
  gitPage.verifyAppName(appName);
});

Then(
  'name field auto populates with value {string} in Import from Docker file page',
  (nodeName: string) => {
    gitPage.verifyNodeName(nodeName);
    gitPage.clickCancel();
  },
);

Then('advanced option Create a route to the application is selected', () => {
  cy.get(gitPO.advancedOptions.createRoute)
    .scrollIntoView()
    .should('be.visible')
    .and('be.checked');
  gitPage.clickCancel();
});

When('user clicks Create button on Deploy Image page', () => {
  gitPage.clickCreate();
});

Then('node is displayed with name {string}', (nodeName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(nodeName);
});

When('user selects Project as {string} from internal registry', (projectName: string) => {
  containerImagePage.selectProject(projectName);
});

When('user selects Image stream tag from internal registry', () => {
  containerImagePage.selectInternalImageRegistry();
});

When('user selects Image Stream as {string} from internal registry', (imageStream: string) => {
  containerImagePage.selectImageStream(imageStream);
});

When('user selects tag as {string} from internal registry', (tag: string) => {
  containerImagePage.selectTag(tag);
});

When('user clicks Cancel button on Deploy Image page', () => {
  gitPage.clickCancel();
});
