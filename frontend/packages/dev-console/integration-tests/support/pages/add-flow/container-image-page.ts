import { messages } from '../../constants/staticText/addFlow-text';
import { containerImagePO } from '../../pageObjects/add-flow-po';

export const containerImagePage = {
  enterExternalRegistryImageName: (imageName: string) =>
    cy.get(containerImagePO.imageSection.externalRegistry.imageName).type(imageName),
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
      .should('have.text', messages.gitUrlValidated),
  enterGitUrl: (gitUrl: string) => {
    cy.byLegacyTestID('application-form-app-name')
      .clear()
      .type(gitUrl);
  },
};
