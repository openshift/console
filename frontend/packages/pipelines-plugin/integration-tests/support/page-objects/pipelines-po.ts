export const pipelineBuilderPO = {
  title: '.odc-pipeline-builder-header h1',
  create: '[data-test-id="submit-button"]',
  cancel: '[data-test-id="reset-button"]',
  add: 'button.pf-c-button.pf-m-link.pf-m-inline',
  configureVia: {
    pipelineBuilder: '#form-radiobutton-editorType-form-field',
    yamlView: '#form-radiobutton-editorType-yaml-field',
  },
  formView: {
    switchToFormView: '[id="form-radiobutton-editorType-form-field"]',
    name: '#form-input-formData-name-field',
    taskDropdown: '[data-id="initial-node"]',
    task: '[data-type="builder"] .odc-pipeline-vis-task',
    plusTaskIcon: 'g.odc-plus-node-decorator',
    seriesTask: '[data-id^="has-run-after-"][data-kind="node"]',
    parallelTask: '[data-id^="shared-parallel-"][data-kind="node"]',
    sectionTitle: '.odc-pipeline-builder-page h2',
    addResourcesLink: 'div.pf-c-form__group button[type="button"]',
    addParams: {
      name: '#form-input-formData-params-0-name-field',
      description: '#form-input-formData-params-0-description-field',
      defaultValue: '#form-input-formData-params-0-default-field',
    },
    addResources: {
      name: '#form-input-formData-resources-0-name-field',
      resourceType: '#form-dropdown-formData-resources-0-type-field',
    },
    sidePane: {
      dialog: 'div.odc-sidebar',
      displayName: '#task-name',
      inputResource: 'select[id*="tasks-0-resources-inputs-0-resource-field"]',
      workSpace: '.odc-task-sidebar__workspace [data-test-id="dropdown-button"] span',
      parameterUrl: '[id$="tasks-0-params-0-value-field"]',
      parameterUrlHelper: '[id$="tasks-0-params-0-value-field-helper"]',
      parameterRevision: '[id$="tasks-0-params-1-value-field"]',
      parameterRevisionHelper: '[id$="tasks-0-params-1-value-field-helper"]',
      imageName: '#IMAGE',
      script: '#SCRIPT',
      args: '#ARGS-0',
      actions: '[data-test-id="actions-menu-button"]',
      workspaces: '#form-dropdown-formData-tasks-0-workspaces-0-workspace-field',
      whenExpression: '[data-test="when-expression"]',
      addWhenExpression: '[data-test="when-expression"] [data-test="add-action"]',
    },
    addWorkspaces: {
      name: '[id$="workspaces-0-name-field"]',
      optionalWorkspace: '#form-checkbox-formData-workspaces-0-optional-field',
    },
    addFinallyNode: '[data-test="pipeline-builder"] [data-test="add-finally-node"]',
    finallyTaskList: '[data-test="builder-finally-node"] [data-test="task-list"]',
  },
  yamlView: {
    switchToYAMLView: '[id="form-radiobutton-editorType-yaml-field"]',
    editor: 'div.react-monaco-editor-container',
    yamlEditor: 'div.monaco-scrollable-element.editor-scrollable.vs-dark',
    sideBar: '[data-test="resource-sidebar"]',
    createButton: '[data-test-id="submit-button"]',
    sidePane: {
      samples: '',
      snippets: '',
      close: 'button[aria-label="Close"]',
    },
  },
  switchToYamlEditorAlert: {
    alertDialog: 'form[name="form"]',
    title: 'form[name="form"] h2',
    continue: '#confirm-action',
  },
  yamlCreatePipeline: {
    helpText: 'p.help-block',
    create: '[data-test-id="submit-button"]',
    cancel: '[data-test-id="reset-button"]',
    yamlEditor: '[data-mode-id="yaml"]',
    samples: {
      sidebar: '[data-test="resource-sidebar"]',
    },
  },
};

export const pipelineDetailsPO = {
  title: '[data-test-section-heading="Pipeline details"]',
  detailsTab: '[data-test-id$="Details"]',
  metricsTab: '[data-test-id="horizontal-link-Metrics"]',
  yamlTab: '[data-test-id$="YAML"]',
  pipelineRunsTab: '[data-test-id="horizontal-link-PipelineRuns"]',
  parametersTab: '[data-test-id="horizontal-link-Parameters"]',
  resourcesTab: '[data-test-id="horizontal-link-Resources"]',
  details: {
    visualization: '[data-test="pipeline-visualization"]',
    finallyNode: '[data-test="pipeline-visualization"] [data-test="finally-node"]',
    sectionTitle: '[data-test-section-heading="Pipeline details"]',
    triggerTemplateSection: 'div.odc-trigger-template-list',
    triggerTemplateLink: 'a[data-test-id^="trigger-template-"]',
    fieldNames: {
      name: '[data-test="Name"]',
      namespace: '[data-test="Namespace"]',
      labels: '[data-test="Labels"]',
      annotations: '[data-test="Annotations"]',
      createdAt: '[data-test="Created at"]',
      owner: '[data-test="Owner"]',
      tasks: '.odc-dynamic-resource-link-list--addSpaceBelow dl dt',
    },
    fieldValues: {
      name: '[data-test-selector="details-item-value__Name"]',
      namespace: '[data-test-selector="details-item-value__Namespace"]',
      labels: '[data-test-selector="details-item-value__Labels"]',
      annotations: '[data-test-selector="details-item-value__Annotations"]',
      createdAt: '[data-test-selector="details-item-value__Created at"]',
      owner: '[data-test-selector="details-item-value__Owner"]',
      workspace: '[data-test-id^="workspace-definition"] dd',
    },
    sections: {
      triggerTemplates: '.odc-trigger-template-list',
      tasks: '.odc-dynamic-resource-link-list--addSpaceBelow',
    },
  },
  yaml: {
    yamlEditor: '[data-mode-id="yaml"]',
  },
  metrics: {
    emptyMessage: '.pf-c-empty-state__body',
    timeRange: '',
    refreshInterval: '',
    graphTitle: '.co-dashboard-card__title',
  },
  pipelineRuns: {
    pipelineRunIcon: '[title="PipelineRun"]',
  },
};

export const triggerTemplateDetailsPO = {
  title: '[data-test-section-heading="TriggerTemplate details"]',
  detailsTab: '[data-test-id="horizontal-link-public~Details"]',
  yamlTab: '[data-test-id="horizontal-link-public~YAML"]',
  details: {
    pipelinesIcon: '[title="Pipeline"]',
    eventListenerLink: '[data-test-id^="event-listener-"]',
    fieldNames: {
      name: '[data-test="Name"]',
      namespace: '[data-test="Namespace"]',
      labels: '[data-test="Labels"]',
      annotations: '[data-test="Annotations"]',
      createdAt: '[data-test="Created at"]',
      owner: '[data-test="Owner"]',
    },
    fieldValues: {
      name: '[data-test-selector="details-item-value__Name"]',
      namespace: '[data-test-selector="details-item-value__Namespace"]',
      labels: '[data-test-selector="details-item-value__Labels"]',
      annotations: '[data-test-selector="details-item-value__Annotations"]',
      createdAt: '[data-test-selector="details-item-value__Created at"]',
      owner: '[data-test-selector="details-item-value__Owner"]',
    },
  },
};

export const eventListenerDetailsPO = {
  title: '[data-test-section-heading="EventListener details"]',
  details: {
    triggerBindingLink: '[data-test-id="github-pullreq"]',
    triggerTemplateIcon: '[title="TriggerTemplate"]',
    eventListenerUrl: '.odc-event-listener-url input',
  },
};

export const clusterTriggerBindingDetailsPO = {
  title: '[data-test-section-heading="ClusterTriggerBinding details"]',
};

export const pipelineRunDetailsPO = {
  logsTab: '[data-test-id="horizontal-link-Logs"]',
  yamlTab: '[data-test-id$="YAML"]',
  detailsTab: '[data-test-id$="Details"]',
  taskRunsTab: '[data-test-id="horizontal-link-Task Runs"]',
  eventsTab: '[data-test-id$="Events"]',
  pipelineRunStatus: 'h1 [data-test="status-text"]',
  details: {
    pipelineLink: '[data-test-id="git-pipeline-events"]',
    sectionTitle: '[data-test-section-heading="PipelineRun details"]',
    pipelineRunDetails: 'div dl',
    workspacesSection: '[data-test-id="workspace-resources-section"]',
    workspacesResources: {
      volumeClaimTemplateResources: '[data-test-id="volumeClaimTemplate-resources-section"]',
      emptyDirectory: '[data-test-id="empty-directory-workspace"]',
    },
  },
  yaml: {
    yamlPage: '[data-mode-id="yaml"]',
    reloadBtn: '[data-test="reload-object"]',
    cancelBtn: '[data-test="cancel"]',
  },
  logs: {
    logPage: '[data-test-id="logs-task-container"]',
  },
  taskRuns: {
    columnNames: {
      name: '[data-label="Name"]',
      task: '[data-label="Task"]',
      pod: '[data-label="Pod"]',
      status: '[data-label="Status"]',
      started: '[data-label="Started"]',
    },
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
  emptyMessage: '[data-test="empty-message"]',
  pipelinesTable: {
    table: 'div[role="grid"]',
    pipelineName: 'tr td:nth-child(1)',
    pipelineRunName: 'tr td:nth-child(2)',
    kebabMenu: '[data-test-id="kebab-button"]',
    columnValues: '[aria-label="Pipelines"] tbody tr td',
    columnNames: 'div[aria-label="Pipelines"] thead tr th',
    pipelineRunIcon: '[title="PipelineRun"]',
  },
  addTrigger: {
    add: '#confirm-action',
    gitProviderType: '[id$="triggerBinding-name-field"]',
    gitUrl: '#form-input-resources-0-data-params-url-field',
    revision: '#form-input-resources-0-data-params-revision-field',
    variablesMessage: 'p.odc-trigger-binding-section__variable-descriptor',
    variablesLink: '.pf-c-form button',
  },
  editPipeline: {
    title: 'h1.odc-pipeline-builder-header__title',
    save: '[data-test-id="submit-button"]',
  },
  removeTrigger: {
    triggerTemplate: '#form-dropdown-selectedTrigger-field',
    remove: '#confirm-action',
  },
  startPipeline: {
    sectionTitle: 'h2.odc-form-section__heading',
    gitResourceDropdown: '[id*="dropdown-resources-0"]',
    gitUrl: '#form-input-resources-0-data-params-url-field',
    revision: '#form-input-resources-0-data-params-revision-field',
    sharedWorkspace: '#form-dropdown-workspaces-0-type-field',
    emptyDirectoryInfo: '[aria-label="Info Alert"]',
    start: '#confirm-action',
    workspaces: {
      workspaceType: '[id$="workspaces-0-type-field"]',
      emptyDirectoryInfo: '.pf-u-screen-reader',
      configMap: '.odc-multiple-key-selector button',
      secret: '.odc-multiple-key-selector button',
      pvc: '[id$=persistentVolumeClaim-claimName-field]',
    },
    secretForm: '.odc-secret-form',
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
  },
};
