export const buildPO = {
  admin: {
    buildTab: '[data-quickstart-id="qs-nav-builds"]',
    nav: '[data-test="nav"]',
  },
  filter: '[data-test-id="filter-dropdown-toggle"] button',
  filterList: '[data-test="filter-dropdown-list"]',
  pane: '.co-m-pane__body',
  eventTab: '[data-test-id="horizontal-link-Events"]',
  eventStream: '.co-sysevent-stream',
  breadcrumb: '[aria-label="Breadcrumb"]',
  failedFilter: '[data-test-row-filter="Failed"]',
  dev: {
    buildTab: '[aria-label="Builds"]',
  },
  decorator: '[data-test="build-decorator"]',
  shipwrightBuild: {
    filterList: '[data-test="filter-dropdown-list"]',
    shipwrightBuildsTab: '[data-test-id="horizontal-link-Shipwright Builds"]',
    shipwrightBuildRunsTab: '[data-test-id="horizontal-link-BuildRuns"]',
    statusText: '[data-test="status-text"]',
    buildrunLogs: '.odc-multi-stream-logs',
    createShipwrightBuild: '#shipwrightBuild-link',
  },
  popup: '[data-test="failure-popup"]',
};

export const createShipwrightBuildPO = {
  nameField: '#form-input-formData-name-field',
  buildStrategyDropdownField: '#form-select-input-formData-build-strategy-field',
  buildStrategyS2IOption: '[id="select-option-formData.build.strategy-source-to-image"]',
  builderImageField: 'input[label="builder-image"]',
  outputImageField: 'input[label="Output image"]',
  submitButton: '[data-test-id="submit-button"]',
  detailsPageTitle: '[data-test-id="resource-title"]',
  detailsPageSourceURLItem: '[data-test-selector="details-item-value__Source URL"]',
  detailsPageBuilderImageItem: '[data-test-selector="details-item-value__Builder image"]',
};
