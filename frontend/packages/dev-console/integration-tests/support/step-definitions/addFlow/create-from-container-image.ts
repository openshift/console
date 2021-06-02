import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions, pageTitle } from '../../constants';
import { gitPO } from '../../pageObjects';
import { addPage, containerImagePage, topologyPage, gitPage } from '../../pages';

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

When('user selects the {string} from Runtime Icon dropdown', (runTimeIcon: string) => {
  containerImagePage.selectRunTimeIcon(runTimeIcon);
});

When('user selects the application {string} from Application dropdown', (appName: string) => {
  containerImagePage.selectOrCreateApplication(appName);
});

Then(
  'user will see the deployed image {string} with {string} icon',
  (imageName: string, runTimeIcon: string) => {
    topologyPage.verifyWorkloadInTopologyPage(imageName);
    topologyPage.verifyRunTimeIconForContainerImage(runTimeIcon);
  },
);

Given(
  'user has deployed container Image {string} from external registry',
  (externalRegistryName: string) => {
    containerImagePage.createContainerImageFromExternalRegistry(externalRegistryName);
  },
);

Given(
  'topology page has a deployed image {string} with Runtime Icon {string}',
  (imageName: string, runTimeIcon: string) => {
    topologyPage.verifyWorkloadInTopologyPage(imageName);
    topologyPage.verifyRunTimeIconForContainerImage(runTimeIcon);
  },
);

When('user right clicks on the node {string} to open context menu', (nodeName: string) => {
  topologyPage.rightClickOnNode(nodeName);
});

When('user selects Edit imagename {string} option', (imageName: string) => {
  cy.byTestActionID(`Edit ${imageName}`).click();
});

When('user updates the Runtime icon to {string}', (runTimeIcon: string) => {
  detailsPage.titleShouldContain(pageTitle.ContainerImage);
  containerImagePage.selectRunTimeIcon(runTimeIcon);
});

Then(
  'user will see the deployment image {string} icon updated to {string} Icon',
  (imageName: string, runTimeIcon: string) => {
    topologyPage.verifyWorkloadInTopologyPage(imageName);
    topologyPage.verifyRunTimeIconForContainerImage(runTimeIcon);
  },
);
