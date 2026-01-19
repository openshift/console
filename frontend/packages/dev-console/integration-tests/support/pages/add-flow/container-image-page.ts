import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';
import { addOptions, messages } from '../../constants';
import { containerImagePO } from '../../pageObjects';
import { addPage } from './add-page';
import { gitPage } from './git-page';

export const containerImagePage = {
  enterExternalRegistryImageName: (imageName: string) => {
    cy.get(containerImagePO.imageSection.externalRegistry.imageName).type(imageName);
    containerImagePage.verifyValidatedMessage();
  },
  selectProject: (projectName: string) =>
    cy.selectValueFromAutoCompleteDropDown(
      containerImagePO.imageSection.internalRegistry.selectProject,
      projectName,
    ),
  selectImageStream: (imageStreamName: string) =>
    cy.selectValueFromAutoCompleteDropDown(
      containerImagePO.imageSection.internalRegistry.imageStream,
      imageStreamName,
    ),
  selectTag: (tag: string) =>
    cy.selectValueFromAutoCompleteDropDown(containerImagePO.imageSection.internalRegistry.tag, tag),
  selectInternalImageRegistry: () =>
    cy.get(containerImagePO.imageSection.internalRegistryImageCheckBox).check(),
  verifyValidatedMessage: () =>
    cy
      .get(containerImagePO.imageSection.externalRegistry.validatedMessage)
      .should('include.text', messages.addFlow.gitUrlValidated),
  enterAppName: (gitUrl: string) => {
    cy.byLegacyTestID('application-form-app-name').clear().type(gitUrl);
  },
  selectRunTimeIcon: (runTimeIcon: string) => {
    cy.selectValueFromAutoCompleteDropDown(
      containerImagePO.imageSection.runTimeIconDropdown,
      runTimeIcon,
    );
  },
  selectCustomIcon: (url: string) => {
    cy.get(containerImagePO.imageSection.addCustomIcon).click();
    // Wait for the modal to open and the URL input to be enabled (yup async validation)
    cy.get(containerImagePO.imageSection.customIconModal.url)
      .should('be.visible')
      .and('not.be.disabled');
    cy.get(containerImagePO.imageSection.customIconModal.url).type(url);
    cy.get(containerImagePO.imageSection.customIconModal.confirmButton).click();
  },
  selectOrCreateApplication: (appName: string) => {
    gitPage.enterAppName(appName);
  },
  createContainerImageFromExternalRegistry: (
    externalRegistryName: string,
    componentName = 'hello-openshift',
    appName = 'ext-app',
    runTimeIcon = 'fedora',
    resourceType = 'deployment',
  ) => {
    addPage.selectCardFromOptions(addOptions.ContainerImage);
    containerImagePage.enterExternalRegistryImageName(externalRegistryName);
    containerImagePage.selectRunTimeIcon(runTimeIcon);
    containerImagePage.selectOrCreateApplication(appName);
    gitPage.enterComponentName(componentName);
    gitPage.selectResource(resourceType);
    gitPage.clickCreate();
    topologyPage.verifyWorkloadInTopologyPage(componentName);
  },
};
