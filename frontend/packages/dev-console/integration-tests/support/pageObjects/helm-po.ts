export const helmPO = {
  noHelmReleasesMessage: 'h3',
  search: '[data-test-id="item-filter"]',
  table: '[role="grid"]',
  helmReleaseName: 'tr td:nth-child(1)',
  resourcesTab: '[data-test-id="horizontal-link-Resources"]',
  revisionHistoryTab: '[data-test-id="horizontal-link-Revision History"]',
  releaseNotesTab: '[data-test-id="horizontal-link-Release Notes"]',
  filterDropdown: 'button[data-test-id="filter-dropdown-toggle"]',
  details: {
    title: '[data-test-section-heading="Helm Release Details"]',
  },
  upgradeHelmRelease: {
    replicaCount: '#root_replicaCount',
    chartVersion: '#form-dropdown-chartVersion-field',
    upgrade: '[data-test-id="submit-button"]',
    cancel: '[data-test-id="reset-button"]',
  },
  rollBackHelmRelease: {
    revision1: '#form-radiobutton-revision-1-field',
    rollBack: '[data-test-id="submit-button"]',
    cancel: '[data-test-id="reset-button"]',
  },
  uninstallHelmRelease: {
    releaseName: '#form-input-resourceName-field',
  },
};
