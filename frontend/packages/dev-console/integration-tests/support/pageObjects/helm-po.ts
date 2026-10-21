export const helmPO = {
  noHelmReleasesMessage: 'h3',
  noHelmSearchMessage: '.loading-box.loading-box__loaded',
  table: '[role="grid"]',
  helmReleaseName: 'tr td:nth-child(1)',
  resourcesTab: '[data-test-id="horizontal-link-Resources"]',
  revisionHistoryTab: '[data-test-id="horizontal-link-Revision history"]',
  releaseNotesTab: '[data-test-id="horizontal-link-Release notes"]',
  filterDropdown: '[data-ouia-component-id="DataViewCheckboxFilter"]',
  filterDropdownItem: '.pf-v6-c-menu__item',
  filters: '[data-ouia-component-id="DataViewFilters"]',
  filter: {
    pendingInstall: '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-pending-install"]',
    pendingUpgrade: '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-pending-upgrade"]',
    pendingRollback:
      '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-pending-rollback"]',
  },
  filterToolBar: '[data-ouia-component-id="DataViewToolbar"]',
  deployedCheckbox: '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-deployed"] input',
  failedCheckbox: '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-failed"] input',
  otherCheckbox: '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-other"] input',
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
  sidePane: {
    chartVersion: '.properties-side-panel-pf-property-value',
  },
  helmActions: {
    upgrade: '[data-test-action="Upgrade"]',
    rollBack: '[data-test-action="Rollback"]',
    deleteHelmRelease: '[data-test-action="Delete Helm Release"]',
  },
};
