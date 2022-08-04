export const buildPO = {
  admin: {
    buildTab: '[data-quickstart-id="qs-nav-builds"]',
    nav: '[data-test="nav"]',
  },
  filter: '[aria-label="Options menu"]',
  filterList: '[aria-labelledby="Status"]',
  pane: '.co-m-pane__body',
  eventTab: '[data-test-id="horizontal-link-public~Events"]',
  eventStream: '.co-sysevent-stream',
  breadcrumb: '[aria-label="Breadcrumb"]',
  failedFilter: '[data-test-row-filter="Failed"]',
  dev: {
    buildTab: '[aria-label="Builds"]',
  },
  shipwrightBuild: {
    shipwrightBuildsTab: '[data-test-id="horizontal-link-Shipwright Builds"]',
    shipwrightBuildRunsTab: '[data-test-id="horizontal-link-BuildRuns"]',
    statusText: '[data-test="status-text"]',
  },
  popup: '[data-test="failure-popup"]',
};
