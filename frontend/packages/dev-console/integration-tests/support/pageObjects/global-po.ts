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
  configMaps: '#ConfigMap',
  secret: '#Secret',
  dropdownButton: '[data-test-id="dropdown-button"]',
  environments: '[data-test-id="environments-header"]',
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
