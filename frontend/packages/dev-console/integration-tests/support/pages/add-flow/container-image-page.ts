
export const containerImageObj = {
    imageSection: {
      externalRegistryImageCheckBox: '#form-radiobutton-registry-external-field',
      internalRegistryImageCheckBox: '#form-radiobutton-registry-internal-field',
      externalRegistry: {
        allowImageFromInsecureRegistry: '#form-checkbox-allowInsecureRegistry-field',
        imageName: '#form-input-searchTerm-field',
        validatedMessage: '#form-input-searchTerm-field-helper'
      },
      internalRegistry: {
        selectProject: '#form-ns-dropdown-imageStream-namespace-field',
        imageStream: '#form-ns-dropdown-imageStream-image-field',
        tag: '#form-dropdown-imageStream-tag-field',
      },
    }
  }


export const containerImagePage = {
    enterExternalRegistryImageName: (imageName: string) => cy.get(containerImageObj.imageSection.externalRegistry.imageName).type(imageName),
    selectProject: (projectName: string) => 
      cy.selectValueFromAutoCompleteDropDown(containerImageObj.imageSection.internalRegistry.selectProject, projectName),
    selectImageStream: (imageStreamName: string) => 
      cy.selectValueFromAutoCompleteDropDown(containerImageObj.imageSection.internalRegistry.imageStream, imageStreamName),
    selectTag: (tag:string) => 
      cy.selectValueFromAutoCompleteDropDown(containerImageObj.imageSection.internalRegistry.tag, tag),
    selectInternalImageRegistry:() => 
    cy.get(containerImageObj.imageSection.internalRegistryImageCheckBox).check(),
    verifyValidatedMessage:() => cy.get(containerImageObj.imageSection.externalRegistry.validatedMessage).should('have.text', 'Validated'),
  }