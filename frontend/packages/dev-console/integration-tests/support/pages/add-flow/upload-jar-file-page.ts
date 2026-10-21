import { uploadJarFilePO } from '../../pageObjects';

export const uploadJarFilePage = {
  // browseJarFile: (filePath: string) => {},
  clickBrowse: () => cy.get(uploadJarFilePO.jar.browse).click(),
  selectBuilderImageVersion: (builderImageVersion: string) => {
    cy.selectByDropDownText(uploadJarFilePO.jar.builderImageVersion, builderImageVersion);
  },
};
