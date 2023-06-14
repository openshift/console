export const buildConfigPO = {
  actionItems: '[data-test-id="action-items"]',
  kebabButton: '[data-test-id="kebab-button"]',
  resourceTitle: '[data-test-id="resource-title"]',
  nameField: '#form-input-formData-name-field',
  buildFrom: {
    buildTypeDropdown: '[id="form-dropdown-formData-images-buildFrom-type-field"]',
    imageStreamDropdown:
      '#form-ns-dropdown-formData-images-buildFrom-imageStreamTag-imageStream-image-field',
    imageStreamTagDropdown:
      '#form-dropdown-formData-images-buildFrom-imageStreamTag-imageStream-tag-field',
  },
  imageRegistryField: '#form-input-formData-images-buildFrom-dockerImage-field',
  contentDirectoryField: '#form-input-formData-source-git-git-dir-field',
  environmentTab: '[data-test-id="horizontal-link-Environment"]',
};
