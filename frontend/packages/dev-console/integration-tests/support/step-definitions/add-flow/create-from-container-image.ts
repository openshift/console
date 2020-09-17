import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage, addPageObj } from '../../pages/add-flow/add-page';
import { containerImagePage } from '../../pages/add-flow/container-image-page';
import { addOptions } from '../../constants/add';
import { topologyPage } from '../../pages/topology-page';

Given('user is at Deploy Image page', () => {
  addPage.selectCardFromOptions(addOptions.ContainerImage);
});

When('user enters Image name from external registry as {string}', (imageName: string) => {
  containerImagePage.enterExternalRegistryImageName(imageName);
});

Then('git url gets Validated', () => {
  addPage.verifyValidatedMessage();
});

Then('image name gets Validated', () => {
  containerImagePage.verifyValidatedMessage();
});

Then('application name displays as {string}', (appName: string) => {
  addPage.veirfyAppName(appName);
});

Then(
  'name field auto populates with value {string} in Import from Docker file page',
  (nodeName: string) => {
    addPage.veirfyNodeName(nodeName);
    addPage.clickCancel();
  },
);

Then('advanced option Create a route to the application is selected', () => {
  cy.get(addPageObj.advancedOptions.createRoute)
    .scrollIntoView()
    .should('be.visible')
    .and('be.checked');
  addPage.clickCancel();
});

When('user clicks Create button on Deploy Image page', () => {
  addPage.clicKCreate();
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

When('user selects Image Stream as {string} from internal registry', (imageSrream: string) => {
  containerImagePage.selectImageStream(imageSrream);
});

When('user selects tag as {string} from internal registry', (tag: string) => {
  containerImagePage.selectTag(tag);
});

When('user clicks Cancel button on Deploy Image page', () => {
  addPage.clickCancel();
});
