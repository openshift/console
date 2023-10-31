export const buildPO = {
  admin: {
    buildTab: '[data-quickstart-id="qs-nav-builds"]',
    nav: '[data-test="nav"]',
  },
  filter: '[aria-label="Options menu"]',
  filterList: '[aria-labelledby="BuildRun-status"]',
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
    filterList: '[aria-labelledby="Status"]',
    shipwrightBuildsTab: '[data-test-id="horizontal-link-Shipwright Builds"]',
    shipwrightBuildRunsTab: '[data-test-id="horizontal-link-BuildRuns"]',
    statusText: '[data-test="status-text"]',
    buildrunLogs: '.odc-multi-stream-logs',
  },
  popup: '[data-test="failure-popup"]',
};
