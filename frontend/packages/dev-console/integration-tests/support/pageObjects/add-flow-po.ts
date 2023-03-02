export const cardTitle = '[data-test="title"]';

export const addPagePO = {
  gettingStarted: '[data-test="getting-started"]',
  detailsOnOffSwitch: '[data-test="details-switch"]',
  cardDetails: 'p.odc-add-card-item__description',
  restoreGettingStarted: '[data-test="restore-getting-started"]',
  kebabMenuGettingStarted: '[data-test="actions"]',
  hideGettingStarted: '[data-test="hide"]',
  closeButton: '[aria-label="label-close-button"]',
  buildWithGuidedDocumentation: '[data-test="card quick-start"]',
  buildWithGuidedDocumentationItems: '[data-test="card quick-start"] [data-test~="item"]',
  viewAllQuickStarts: '[data-test="item all-quick-starts"]',
  helmChartRepositoriesCard: '[data-test="card helm-chart-repositories"]',
};

export const gitPO = {
  noWorkLoadsText: 'h2.co-hint-block__title',
  sectionTitle: '.odc-form-section__heading',
  gitRepoUrl: '[data-test-id="git-form-input-url"]',
  builderImageCard: '.odc-selector-card',
  nodeName: '[data-test-id="application-form-app-name"]',
  appName: '[id$=application-name-field]',
  createNewApp: '[data-test-id="dropdown-menu"]',
  newAppName: '[data-test-id="application-form-app-input"]',
  create: '[data-test-id="submit-button"]',
  cancel: '[data-test-id="reset-button"]',
  gitSection: {
    validatedMessage: '[id$="git-url-field-helper"]',
    showAdvancedGitOptions: '',
    advancedGitOptions: {
      gitReference: '#form-input-git-ref-field',
      contextDir: '#form-input-git-dir-field',
      sourceSecret: '',
    },
  },
  builderSection: {
    builderImageDetected: '[aria-label="Success Alert"]',
    builderImageVersion: '#form-dropdown-image-tag-field',
    unableToDetectBuilderImage: '[aria-label="Warning Alert"]',
  },
  pipeline: {
    infoMessage: '[aria-label="Info Alert"]',
    addPipeline: '#form-checkbox-pipeline-enabled-field',
    pipelineDropdown: '#form-dropdown-pipeline-templateSelected-field',
  },
  advancedOptions: {
    createRoute: '#form-checkbox-route-create-field',
    routing: {
      hostname: '#form-input-route-hostname-field',
      path: '#form-input-route-path-field',
      targetPort: 'input[placeholder="8080"]',
      secureRoute: 'input#form-checkbox-route-secure-field',
      tlsTermination: 'button#form-dropdown-route-tls-termination-field',
      insecureTraffic: 'button#form-dropdown-route-tls-insecureEdgeTerminationPolicy-field',
      labels: 'input[data-test="route-labels"]',
    },
    buildConfig: {
      webHookBuildTrigger: 'input#form-checkbox-build-triggers-webhook-field',
      buildTriggerImage: 'input#form-checkbox-build-triggers-image-field',
      buildTriggerConfigField: 'input#form-checkbox-build-triggers-config-field',
      // Add Environment Value
      envName: 'input[data-test=pairs-list-name]',
      envValue: 'input[data-test=pairs-list-value]',
      // Count for Rows in Environment Variables section
      envRows: 'div.row.pairs-list__row',
      deleteRowButton: 'button[data-test="delete-button"]',
    },
    deployment: {
      deploymentTriggerImage: 'input#form-checkbox-deployment-triggers-image-field',
      deploymentImageConfig: 'input#form-checkbox-deployment-triggers-config-field',
      envName: '[data-test=pairs-list-name]',
      envValue: '[data-test=pairs-list-value]',
      // Count for Rows in Environment Variables section
      envRows: 'div.row.pairs-list__row',
      deleteRowButton: 'button[data-test="delete-button"]',
    },
    scaling: {
      decrement: 'button[aria-label="Decrement"]',
      increment: 'button[aria-label="Increment"]',
      replicaCount: 'input#form-number-spinner-deployment-replicas-field',
    },
    resourceLimit: {
      cpuRequest: 'input[name="limits.cpu.requestValue"]',
      cpuLimit: 'input[name="limits.cpu.limitValue"]',
      memoryRequest: 'input[name="limits.memory.requestValue"]',
      memoryLimit: 'input[name="limits.memory.limitValue"]',
      cpuRequestHelperText: 'div#form-resource-limit-limits-cpu-request-field-helper',
      cpuLimitHelperText: 'div#form-resource-limit-limits-cpu-limit-field-helper',
      memoryRequestHelperText: 'div#form-resource-limit-limits-memory-request-field-helper',
      memoryLimitHelperText: 'div#form-resource-limit-limits-memory-limit-field-helper',
    },
    labels: 'input[data-test="labels"]',
    resourcesDropdown: '#form-select-input-resources-field',
    resources: {
      deployment: '#select-option-resources-kubernetes',
      deploymentConfig: '#select-option-resources-openshift',
      knative: '#select-option-resources-knative',
    },
  },
  importStrategy: {
    devFileStrategy: '[data-test=import-strategy-Devfile]',
    editImportStrategyBtn: '[data-test=import-strategy-button]',
    devFilePathInput: '[data-test=git-form-devfile-path-input]',
    devFileHelperText: '.pf-c-form__helper-text',
  },
};

export const catalogPO = {
  search: 'input[placeholder="Filter by keyword..."]',
  filterKeyword: 'input.pf-c-search-input__text-input',
  templateTitle: '.catalog-tile-pf-title',
  card: '.pf-c-card',
  cardBadge: 'span.pf-c-badge',
  groupBy: '[data-test-id="dropdown-button"]',
  aToz: '[data-test-dropdown-menu="desc"]',
  zToA: '[data-test-dropdown-menu="asc"]',
  cardType: 'span.pf-c-badge',
  create: 'button[type="submit"]',
  cancel: '[data-test-id="reset-button"]',
  cardList: '[role="grid"]',
  cardHeader: '.pf-c-badge.pf-m-read',
  groupByMenu: 'pf-c-dropdown__menu',
  catalogBatch: '.odc-catalog-badges',
  batchLabel: '.odc-catalog-badges__label',
  bindingFilterBindable: '[data-test="bindable-bindable"]',
  filterInfoTip: '.co-field-level-help__icon',
  filterInfoTipContent: '.pf-c-popover__content',
  filterCheckBox: '[class="pf-c-check__input"]',
  chartRepositoryGroup: '[data-test-group-name="chartRepositoryTitle"]',
  catalogTypeLink: 'li.vertical-tabs-pf-tab.shown.text-capitalize.co-catalog-tab__empty',
  catalogTypes: {
    operatorBacked: '[data-test="kind-cluster-service-version"]',
    helmCharts: '[data-test="tab HelmChart"]',
    builderImage: '[data-test="tab BuilderImage"]',
    template: '[data-test="tab Template"]',
    serviceClass: '[data-test="kind-cluster-service-class"]',
    managedServices: '[data-test="kind-managed-service"]',
    eventSources: '[data-test="tab EventSource"]',
    eventSinks: '[data-test="tab EventSink"]',
  },
  catalogCategoriesByTitle: {
    'CI/CD': '[data-test="tab cicd"]',
    Databases: '[data-test="tab databases"]',
    Languages: '[data-test="tab languages"]',
    Middleware: '[data-test="tab middleware"]',
    Other: '[data-test="tab other"]',
  },
  cards: {
    mariaDBTemplate: 'a[data-test="Template-MariaDB"] .catalog-tile-pf-title',
    phpCakeTemplate: '[data-test="Template-CakePHP + MySQL"] .catalog-tile-pf-title',
    nodeJsBuilderImage: 'a[data-test="BuilderImage-Node.js"] .catalog-tile-pf-title',
    nodejsPostgreSQL:
      'a[data-test="Template-Node.js + PostgreSQL (Ephemeral)"] .catalog-tile-pf-title',
    apacheHTTPServer: 'a[data-test="Template-Apache HTTP Server"] .catalog-tile-pf-title',
    nginxHTTPServer:
      'a[data-test="Template-Nginx HTTP server and a reverse proxy"] .catalog-tile-pf-title',
    knativeKafka: '[data-test="OperatorBackedService-Knative Kafka"]',
    helmNodejs: '[data-test="HelmChart-Nodejs"]',
  },
  sidePane: {
    dialog: '[role="dialog"]',
    instantiateTemplate: '[role="dialog"] .pf-m-primary',
    create: 'a[title="Create"]',
    installHelmChart: 'a[title="Install Helm Chart"]',
    createApplication: '[role="dialog"] a[role="button"]',
  },
  mariaDBTemplate: {
    namespace: '#namespace',
    title: 'h1.co-m-pane__heading',
    memoryLimit: '#MEMORY_LIMIT',
    imageStreamNameSpace: '#NAMESPACE',
    databaseServiceName: '#DATABASE_SERVICE_NAME',
    mariaDBConnectionUserName: '#MYSQL_USER',
  },
  createKnativeServing: {
    logo: 'h1.co-clusterserviceversion-logo__name__clusterserviceversion',
    name: '#root_metadata_name',
    labels: 'input[placeholder="app=frontend"]',
  },
  installHelmChart: {
    logo: 'h1.co-clusterserviceversion-logo__name__clusterserviceversion',
    create: '[data-test-id="submit-button"]',
    releaseName: '#form-input-releaseName-field',
    yamlView: '#form-radiobutton-editorType-yaml-field',
    formView: '#form-radiobutton-editorType-form-field',
    cancel: '[data-test-id="reset-button"]',
    chartVersion: '#form-dropdown-chartVersion-field',
    replicaCount: '#root_replicaCount',
    ingressLink: '#root_ingress_accordion-toggle',
    ingress: {
      enabled: '#root_ingress_enabled',
      hostsLink: '#root_ingress_hosts_accordion-toggle',
      tlsLink: '#root_ingress_tls_accordion-toggle',
      hostDetails: {
        hostName: '#root_ingress_hosts_0_host',
        removeHost: '[id$="remove-btn"]',
      },
      pathsLink: '#root_ingress_hosts_0_paths_accordion-toggle',
      AddPathButton: '#root_ingress_hosts_0_paths_add-btn',
      AddHostButton: '#root_ingress_hosts_add-btn',
    },
  },
  operatorBacked: {
    name: '#root_metadata_name',
  },
  s2I: {
    gitRepoUrl: '[data-test-id="git-form-input-url"]',
    builderImageVersion: '#form-dropdown-image-tag-field',
    appName: '[data-test-id="application-form-app-input"]',
    name: '[data-test-id="application-form-app-name"]',
    resourceTypes: {
      deployment: '#form-radiobutton-resources-kubernetes-field',
      deploymentConfig: '#form-radiobutton-resources-openshift-field',
      knative: '#form-radiobutton-resources-knative-field',
    },
    addPipeline: {
      pipelineCheckBox: '#form-checkbox-pipeline-enabled-field',
    },
    createRoute: '#form-checkbox-route-create-field',
  },
};

export const samplesPO = {
  search: 'input[placeholder="Filter by keyword..."]',
  cards: {
    httpdTemplate: 'a[data-test="BuilderImage-Httpd"] .catalog-tile-pf-title',
    basicgoTemplate: 'a[data-test="Devfile-Basic Go"] .catalog-tile-pf-title',
  },
};

export const containerImagePO = {
  form: '[data-test-id="deploy-image-form"]',
  imageSection: {
    externalRegistryImageCheckBox: '#form-radiobutton-registry-external-field',
    internalRegistryImageCheckBox: '#form-radiobutton-registry-internal-field',
    runTimeIconDropdown: '.odc-icon-dropdown button',
    externalRegistry: {
      allowImageFromInsecureRegistry: '#form-checkbox-allowInsecureRegistry-field',
      imageName: '#form-input-searchTerm-field',
      validatedMessage: '#form-input-searchTerm-field-helper',
    },
    internalRegistry: {
      selectProject: '#form-ns-dropdown-imageStream-namespace-field',
      imageStream: '#form-ns-dropdown-imageStream-image-field',
      tag: '#form-dropdown-imageStream-tag-field',
    },
  },
  appName: '#form-dropdown-application-name-field',
};

export const eventSourcePO = {
  search: '[placeholder="Filter by keyword..."]',
  yamlView: '#form-radiobutton-editorType-yaml-field',
  formView: '#form-radiobutton-editorType-form-field',
  addButton: 'a[role="button"]',
  nodeHandler: '[data-test-id="base-node-handler"]',
  apiServerSource: {
    apiServerSourceSection: '[data-test~="ApiServerSource"][data-test~="section"]',
    apiVersion: '[data-test=pairs-list-name]',
    kind: '[data-test=pairs-list-value]',
    serviceAccountName: '[id$=ApiServerSource-serviceAccountName-field]',
    name: '[data-test-id="application-form-app-name"]',
    mode: '[id$=ApiServerSource-mode-field]',
  },
  sinkBinding: {
    sinkBindingSection: '[data-test~="SinkBinding"][data-test~="section"]',
    apiVersion: '[data-test-id="sinkbinding-apiversion-field"]',
    kind: '[data-test-id="sinkbinding-kind-field"]',
    matchLabels: {
      name: '[data-test="pairs-list-name"]',
      value: '[data-test="pairs-list-value"]',
    },
    sink: {
      resourceRadioButton: '[id$=sinkType-resource-field]',
      uriRadioButton: '[id$="sinkType-uri-field"]',
      resource: {
        resourceDropdown: '[id*=sink-key-field]',
      },
      uri: {
        uriName: '[data-test-id="sink-section-uri"]',
      },
    },
    name: '[data-test-id="application-form-app-name"]',
    appName: '[data-test-id="application-form-app-input"]',
    notifierHeader: 'div[aria-label="Default Alert"] h4',
    notifierMessage: 'div[aria-label="Default Alert"] div.pf-c-alert__description',
  },
  pingSource: {
    data: '[id$="PingSource-data-field"]',
    schedule: '[id$="PingSource-schedule-field"]',
    name: '[id$="name-field"]',
  },
  containerImage: {
    containerSourceSection: '[data-test~="ContainerSource"][data-test~="section"]',
    image: '[data-test-id="container-image-field"]',
    name: '[data-test-id="container-name-field"]',
    arguments: '[data-test="text-column-field"]',
    addArgs: '[data-test="add-action"]',
    environmentVariableName: '[data-test="pairs-list-name"]',
    environmentVariableValue: '[data-test="pairs-list-name"]',
    addMoreRow: '[data-test="add-button"]',
  },
  createPingSource: {
    data: '#form-input-formData-data-PingSource-data-field',
    schedule: '#form-input-formData-data-PingSource-schedule-field',
    name: '#form-input-formData-name-field',
    resourceToggleButton: '[id="form-radiobutton-formData-sinkType-resource-field"]',
    resourceDropDownField: '[id="form-ns-dropdown-formData-sink-key-field"]',
    resourceDropDownItem: '[data-test="dropdown-menu-item-link"]',
    resourceFilter: '[data-test-id="dropdown-text-filter"]',
    resourceSearch: '[placeholder="Select resource"]',
  },
  createSinkBinding: {
    resourceToggleButton: '[data-test="resource-view-input"]',
    resourceDropDownField: '[id="form-ns-dropdown-formData-sink-key-field"]',
    resourceDropDownItem: '[data-test="dropdown-menu-item-link"]',
    resourceSearchField: '[data-test-id="dropdown-text-filter"]',
    createButton: '[data-test=confirm-action]',
    moveSinkButton: '[data-test-action="Move sink"]',
    eventSourceNode: 'g.odc-event-source',
    uriNode: 'g.odc-sink-uri',
  },
};

export const eventSinkPO = {
  search: '[placeholder="Filter by keyword..."]',
};

export const devFilePO = {
  form: '[data-test-id="import-devfile-form"]',
  formFields: {
    validatedMessage: '#form-input-git-url-field-helper',
    advancedGitOptions: {
      gitReference: '#form-input-git-ref-field',
      contextDir: 'form-input-git-dir-field',
      sourceSecret: '',
    },
  },
};

export const channelPO = {
  channelType: '[data-test-id="dropdown-button"]',
  channelName: '[data-test-id="channel-name"]',
  appName: '[data-test-id="application-form-app-input"]',
};

export const yamlPO = {
  yamlEditor: '.react-monaco-editor-container',
};

export const uploadJarFilePO = {
  jar: {
    browse: '#upload-jar-field-browse-button',
    jarFile: '#upload-jar-field-filename',
    optionalJavaCommands: '[data-test-id="upload-jar-form-java-args"]',
    runTimeIcon: '.odc-icon-dropdown',
    builderImageVersion: '#form-dropdown-image-tag-field',
  },
};
export const quickSearchAddPO = {
  quickSearchButton: '[data-test="quick-search"]',
  quickSearchBar: '[data-test="quick-search-bar"]',
  quickSearchInput: '[data-test~="quick-search-bar"] [data-test~="input"]',
  quickSearchListItem(itemName: string, itemType: string): string {
    return `[data-test="item-name-${itemName}-${itemType}"]`;
  },
  quickSearchCreateButton: '[data-test="create-quick-search"]',
  viewInDevCatalog: '#devCatalog',
  quickSearchNoResults: '[data-test="quick-search-no-results"]',
};

export const helmChartRepositoriesPO = {
  yaml: {
    yamlSwitcher: '[data-test="yaml-view-input"]',
    yamlEditor: '[data-test="yaml-editor"]',
  },
  formTitle: '[data-test="form-title"]',
  cancelButton: '[data-test-id="cancel-button"]',
  name: '#form-input-formData-repoName-field',
  displayName: '#form-input-formData-repoDisplayName-field',
  description: '#form-input-formData-repoDescription-field',
  url: '#form-input-formData-repoUrl-field',
};
