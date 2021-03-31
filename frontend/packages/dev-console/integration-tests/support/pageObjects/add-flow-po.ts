export const cardTitle = '.catalog-tile-pf-title';

export const gitPO = {
  noWorkLoadsText: 'h2.co-hint-block__title',
  sectionTitle: '.odc-form-section__heading',
  gitRepoUrl: '[data-test-id="git-form-input-url"]',
  builderImageCard: '.odc-selector-card',
  nodeName: '[data-test-id="application-form-app-name"]',
  appName: '[id$=application-name-field]',
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
  },
  resources: {
    deployment: '#form-radiobutton-resources-kubernetes-field',
    deploymentConfig: '#form-radiobutton-resources-openshift-field',
    knative: '#form-radiobutton-resources-knative-field',
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
    },
    buildConfig: {
      webHookBuildTrigger: 'input#form-checkbox-build-triggers-webhook-field',
      buildTriggerImage: 'input#form-checkbox-build-triggers-image-field',
      buildTriggerConfigField: 'input#form-checkbox-build-triggers-config-field',
      // Add Environment Value
      envName: 'input[placeholder="name"]',
      envValue: 'input[placeholder="value"]',
      // Count for Rows in Environment Variables section
      envRows: 'div.row.pairs-list__row',
      deleteRowButton: 'button[data-test="delete-button"]',
    },
    deployment: {
      deploymentTriggerImage: 'input#form-checkbox-deployment-triggers-image-field',
      deploymentImageConfig: 'input#form-checkbox-deployment-triggers-config-field',
      envName: 'input[placeholder="name"]',
      envValue: 'input[placeholder="value"]',
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
    labels: 'input#tags-input',
  },
};

export const catalogPO = {
  search: 'input[placeholder="Filter by keyword..."]',
  card: 'a.pf-c-card',
  groupBy: '[data-test-id="dropdown-button"]',
  aToz: '[data-test-dropdown-menu="desc"]',
  zToA: '[data-test-dropdown-menu="asc"]',
  cardType: 'span.pf-c-badge',
  create: 'button[type="submit"]',
  cancel: '[data-test-id="reset-button"]',
  catalogTypes: {
    operatorBacked: '[data-test="kind-cluster-service-version"]',
    helmCharts: 'a[href="/?catalogType=HelmChart"]',
    builderImage: 'ul:nth-child(3) > li:nth-child(1) > a', // This needs to be changed
    template: 'a[href="/?catalogType=Template"]',
    serviceClass: '[data-test="kind-cluster-service-class"]',
    managedServices: '[data-test="kind-managed-service"]',
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
    install: '[data-test-id="submit-button"]',
    releaseName: '#form-input-releaseName-field',
    yamlView: '#form-radiobutton-editorType-yaml-field',
    formView: '#form-radiobutton-editorType-form-field',
    cancel: '[data-test-id="reset-button"]',
    chartVersion: '#form-dropdown-chartVersion-field',
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

export const containerImagePO = {
  imageSection: {
    externalRegistryImageCheckBox: '#form-radiobutton-registry-external-field',
    internalRegistryImageCheckBox: '#form-radiobutton-registry-internal-field',
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
};

export const eventSourcePO = {
  search: '[placeholder="Filter by type..."]',
  apiServerSource: {
    apiVersion: 'input[placeholder="apiversion"]',
    kind: 'input[placeholder="kind"]',
    serviceAccountName: '#form-ns-dropdown-data-apiserversource-serviceAccountName-field',
    sinkResource: '#form-ns-dropdown-sink-key-field',
    name: '[data-test-id="application-form-app-name"]',
    mode: '#form-dropdown-data-apiserversource-mode-field',
  },
  sinkBinding: {
    apiVersion: '[data-test-id="sinkbinding-apiversion-field"]',
    kind: '[data-test-id="sinkbinding-kind-field"]',
    sinkResource: '[id*=sink-key-field]',
    name: '[data-test-id="application-form-app-name"]',
    resource: '#form-radiobutton-sinkType-resource-field',
    uri: '#form-radiobutton-sinkType-uri-field',
    notifierHeader: 'div[aria-label="Default Alert"] h4',
    notifierMessage: 'div[aria-label="Default Alert"] div.pf-c-alert__description',
  },
  pingSource: {
    data: '#form-input-data-pingsource-jsonData-field',
    schedule: '#form-input-data-pingsource-schedule-field',
    name: '[data-test-id="application-form-app-name"]',
  },
  containerImage: {
    image: '[data-test-id="container-image-field"]',
  },
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
