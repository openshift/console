export const devNavigationMenuPO = {
  pipelines: '[data-test-id="pipeline-header"]',
  add: '[data-test-id="+Add-header"]',
  topology: '[data-test-id="topology-header"]',
  gitOps: '[data-test-id="gitops-header"]',
  monitoring: '[data-test-id="monitoring-header"]',
  pageSideBar: '#page-sidebar',
  builds: '[data-test-id="build-header"]',
  search: '[data-test-id="search-header"]',
  helm: '[data-test-id="helm-releases-header"]',
  project: '[data-test-id="project-details-header"]',
  secret: '#Secret',
  dropdownButton: '[data-test="console-select-menu-toggle"]',
  environments: '[data-test-id="environments-header"]',
  functions: '[data-test-id="functions-details-header"]',
};

export const adminNavigationMenuPO = {
  home: { main: '[data-quickstart-id="qs-nav-home"]', search: "a[href*='/search/ns/']" },
  workloads: { main: '[data-quickstart-id="qs-nav-workloads"]', pods: "a[href*='/core~v1~Pod']" },
};

export const createSourceSecret = {
  form: 'form.co-create-secret-form.modal-content',
  secretName: '#secret-name',
  authenticationType: '#dropdown-selectbox',
  basicAuthentication: {
    userName: '#username',
    password: '#password',
  },
  sshKey: {
    sshPrivateKey: '[data-test-id="file-input-textarea"]',
  },
};

export const actionsMenu = '[data-test-id="actions-menu-button"]';
export const search = '[data-test-id="item-filter"]';
export const table = '[role="grid"]';
export const formPO = {
  configureVia: {
    formView: '#form-radiobutton-editorType-form-field',
    yamlView: '#form-radiobutton-editorType-yaml-field',
  },
  create: '[data-test-id="submit-button"]',
  cancel: '[data-test-id="reset-button"]',
  save: '[data-test="save-changes"]',
  errorAlert: '[aria-label="Danger Alert"]',
  successAlert: '[aria-label="Success Alert"]',
  confirm: '[data-test="confirm-action"]',
};
export const pagePO = {
  create: '[data-test="item-create"]',
  breadcrumb: '[aria-label="Breadcrumb"]',
};
export const resourceRow = '[data-test-rows="resource-row"]';
export const helpDropdownMenu = '[data-test="help-dropdown-toggle"]';
