export const pipelineBuilderPO = {
  title: '.odc-pipeline-builder-header h1',
  name: '#form-input-name-field',
  taskDropdown: 'foreignObject button',
  task: 'foreignObject div.odc-pipeline-vis-task__title',
  sectionTitle: '.odc-pipeline-builder-page h2',
  create: '[data-test-id="submit-button"]',
  cancel: '[data-test-id="reset-button"]',
  add: 'button.pf-c-button.pf-m-link.pf-m-inline',
  addParams: {
    name: '#form-input-params-0-name-field',
    description: '#form-input-params-0-description-field',
    defaultValue: '#form-input-params-0-default-field',
  },
  addResources: {
    name: '#form-input-resources-0-name-field',
    resourceType: '#form-dropdown-resources-0-type-field',
  },
  switchToYamlEditorAlert: {
    alertDialog: 'form[name="form"]',
    title: 'form[name="form"] h2',
    continue: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
  },
  yamlCreatePipeline: {
    helpText: 'p.help-block',
    create: '[data-test="save-changes"]',
    cancel: '#cancel',
  },
  sidePane: {
    dialog: 'div.odc-sidebar',
    displayName: '#task-name',
    inputResource: 'div.pf-c-form [data-test-id="dropdown-button"]',
  },
};

export const pipelineDetailsPO = {
  title: '[data-test-section-heading="Pipeline Details"]',
  actionsMenu: '[data-test-id="actions-menu-button"]',
  details: {
    triggerTemplateSection: 'div.odc-trigger-template-list',
    triggerTemplateLink: 'a[data-test-id^="trigger-template-"]',
  },
};

export const triggerTemplateDetailsPO = {
  title: '[data-test-section-heading="Trigger Template Details"]',
  actions: '[data-test-id="actions-menu-button"]',
  details: {
    eventListenerLink: 'a[data-test-id^="event-listener-"]',
  },
};

export const eventListenerDetailsPO = {
  title: '[data-test-section-heading="Event Listener Details"]',
  actions: '[data-test-id="actions-menu-button"]',
  details: {
    triggerBindingLink: '[data-test-id="github-pullreq"]',
  },
};

export const clusterTriggerBindingDetailsPO = {
  title: '[data-test-section-heading="ClusterTriggerBinding Details"]',
  actions: '[data-test-id="actions-menu-button"]',
};

export const pipelineRunDetailsPO = {
  actions: '[data-test-id="actions-menu-button"]',
  logsTab: '[data-test-id="horizontal-link-Logs"]',
  yamlTab: '[data-test-id="horizontal-link-YAML"]',
  detailsTab: '[data-test-id="horizontal-link-Details"]',
  pipelineRunStatus: 'h1 [data-test="status-text"]',
  details: {
    pipelineLink: '[data-test-id="git-pipeline-events"]',
    sectionTitle: '[data-test-section-heading="Pipeline Run Details"]',
    pipelineRunDetails: 'div dl',
  },
  yaml: {
    yamlPage: '[data-mode-id="yaml"]',
    reloadBtn: '[data-test="reload-object"]',
    cancelBtn: '[data-test="cancel"]',
  },
  logs: {
    logPage: '[data-test-id="logs-task-container"]',
  },
};

export const pipelineRunsPO = {
  pipelineRunsTable: {
    table: 'div[role="grid"]',
    pipelineRunName: 'tr td:nth-child(1)',
    status: '[data-test="status-text"]',
  },
};

export const pipelinesPO = {
  createPipeline: '#yaml-create',
  search: 'input[data-test-id="item-filter"]',
  pipelinesTable: {
    table: 'div[role="grid"]',
    pipelineName: 'tr td:nth-child(1)',
    pipelineRunName: 'tr td:nth-child(2)',
    kebabMenu: '[data-test-id="kebab-button"]',
    columnValues: '[aria-label="Pipelines"] tbody tr td',
    columnNames: 'div[aria-label="Pipelines"] thead tr th',
  },
  addTrigger: {
    add: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
    gitProviderType: '[id$="triggerBinding-name-field"]',
    gitUrl: '#form-input-resources-0-data-params-url-field',
    revision: '#form-input-resources-0-data-params-revision-field',
    variablesMessage: 'p.odc-trigger-binding-section__variable-descriptor',
    variablesLink: '.pf-c-form button',
  },
  editPipeline: {
    title: 'h1.odc-pipeline-builder-header__title',
  },
  removeTrigger: {
    triggerTemplate: '#form-dropdown-selectedTrigger-field',
    remove: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
  },
  startPipeline: {
    sectionTitle: 'h2.odc-form-section__heading',
    gitUrl: '#form-input-resources-0-data-params-url-field',
    revision: '#form-input-resources-0-data-params-revision-field',
    sharedWorkspace: '#form-dropdown-workspaces-0-type-field',
    start: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
    advancedOptions: {
      secretFormTitle: 'h1.odc-secret-form__title',
      secretName: '#form-input-secretName-field',
      accessTo: '#form-dropdown-annotations-key-field',
      serverUrl: '#form-input-annotations-value-field',
      authenticationType: '#form-dropdown-type-field',
      registryServerAddress: 'input[name="address"]',
      userName: 'input[name="username"]',
      password: 'input[name="password"]',
      email: 'input[name="email"]',
      sshPrivateKey: '[data-test-id="file-input-textarea"]',
      tickIcon: '[data-test-id="check-icon"]',
      crossIcon: '[data-test-id="close-icon"]',
    },
  },
  deletePipeline: {
    delete: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
  },
};
