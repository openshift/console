export const topologyPO = {
  switcher: 'button[data-test-id="topology-switcher-view"]',
  noWorkLoadsText: 'h2.co-hint-block__title',
  title: 'h1.ocs-page-layout__title',
  search: '[data-test-id="item-filter"]',
  resetView: '[id="reset-view"]',
  clearFilter: '[class="pf-c-toolbar__item"]',
  emptyStateIcon: 'div.pf-c-empty-state__icon',
  emptyText: '[data-test="no-resources-found"]',
  addToApplication: '[data-test-action="add-to-application"]',
  addToApplicationInContext: 'button.pf-topology-context-sub-menu.pf-c-dropdown__menu-item',
  quickSearch: '[data-test="quick-search-bar"]',
  filterByResourceDropDown: '[data-test="filter-by-resource"] button',
  topologyDropDown: 'button[aria-label="Options menu"]',
  emptyView: {
    startBuildingYourApplicationLink: '[data-test="start-building-your-application"]',
    addPageLink: '[data-test="add-page"]',
  },
  graph: {
    reset: '#reset-view',
    layoutViewGroup: '.odc-topology__layout-group',
    zoomIn: '#zoom-in',
    zoomOut: '#zoom-out',
    saveModal: '[data-test="confirm-action"]',
    modalContent: '[class="modal-content"]',
    fitToScreen: '#fit-to-screen',
    emptyGraph: '[data-test-id="topology"]',
    filterDropdown: '[id^=pf-select-toggle-id]',
    nodeContextMenu: '.pf-c-dropdown__menu-item',
    nodeLabel: 'g.pf-topology__node__label',
    knativeNodeLabel: '.odc-base-node__label',
    groupLabel: 'g.pf-topology__group__label',
    selectNodeLabel: 'g.odc-base-node__label',
    knativeServiceNode: '[data-type="knative-service"]',
    eventSourceNode: '[data-type="event-source-link"]',
    contextMenu: '#popper-container ul',
    workloads: 'g[data-surface="true"]',
    node: '[data-test-id="base-node-handler"]',
    workload: '[data-type="workload"]',
    triggerLink: '[data-type="event-pubsub-link"]',
    triggerEdgeLink: '[class="pf-topology__edge__link"]',
    confirmModal: '[data-test="confirm-action"]',
    deleteWorkload: '[data-test="confirm-action"]',
    eventSourceWorkload: '[data-type="event-source"]',
    applicationGroupingTitle: '.odc-topology-list-view__application-label',
    addNewAnnotations: '[data-test="add-button"]',
    deleteApplication: '[id="form-input-resourceName-field"]',
    connector: '[data-test-id="edge-handler"]',
    routeDecorator: '[aria-label="Open URL"]',
    subscriber: {
      dropdown: '[id="form-ns-dropdown-spec-subscriber-ref-name-field"]',
      filter: '[class="pf-c-dropdown__toggle-text"]',
      filterItemLink: '[data-test="dropdown-menu-item-link"]',
      filterText: '[data-test-id="dropdown-text-filter"]',
      filterField: '[id="form-ns-dropdown-ref-name-field"]',
    },
    displayOptions: {
      connectivityMode: '[id="showGroups"]',
      consumptionMode: '[id="hideGroups"]',
      expandSwitchToggle: '.pf-c-switch__input',
      applicationGroupings: '[id$=expand-app-groups]',
      showLabels: '[id$=show-labels]',
      showPodCount: '[id$=show-pod-count]',
    },
    contextMenuOptions: {
      addToProject: '.pf-topology-context-sub-menu',
    },
    addLink: '[data-test="add-page"]',
    quickSearch: '[data-test="quick-search-bar"]',
    warningBackground: '[class="pf-topology__node__background pf-m-warning"]',
  },
  list: {
    appName: '#HelmRelease ul li div',
    nodeName: '#HelmRelease ul li div',
    resourceTitle: 'pf-c-data-list__cell.odc-topology-list-view__kind-label',
    switcher: '[data-test-id="topology-switcher-view"][aria-label="Graph view"]',
    view: '[aria-label="Topology List View"]',
    switchGraph: '[aria-label="Graph view"]',
  },
  sidePane: {
    actionsDropDown: '[data-test-id="actions-menu-button"]',
    showPodCount: '[id$=show-pod-count]',
    dialog: '[role="dialog"]',
    title: '[role="dialog"] h1',
    knativeServiceIcon: '[title="Service"]',
    tabs: '[role="dialog"] li button',
    sectionTitle: 'h2',
    close: 'button[aria-label="Close"]',
    labelsList: '[data-test="label-list"]',
    editAnnotations: '[data-test="edit-annotations"]',
    tabName: '[role="dialog"] li button',
    healthCheckAlert: 'div.odc-topology-sidebar-alert',
    resourceQuotaAlert: 'div.odc-topology-sidebar-alert [aria-label="Warning Alert"]',
    podScale: 'button.pf-c-button.pf-m-plain.pf-m-block',
    podText: 'text.pf-chart-donut-title.pod-ring__center-text',
    applicationGroupingsTitle: '.overview__sidebar-pane-head.resource-overview__heading',
    applicationGroupingsSidepane: 'overview__sidebar-pane resource-overview',
    resourcesTabApplicationGroupings: '.co-m-horizontal-nav__menu-item',
    pipelineRunsDetails: '.sidebar__section-heading',
    pipelineRunsLogSnippet: '.ocs-log-snippet__log-snippet',
    pipelineRunsStatus: '.ocs-log-snippet__status-message',
    pipelineRunsLinks: 'a.sidebar__section-view-all',
    detailsTab: {
      labels: '[data-test="label-list"]',
      annotations: '[data-test="edit-annotations"]',
      labelsEdit: '[data-test="Labels-details-item__edit-button"]',
    },
    resourcesTab: {
      startLastRun: '[role="dialog"] li.list-group-item.pipeline-overview div button',
      pipelineRuns: 'li.odc-pipeline-run-item',
      routeLink: '[data-test-id="route-link"]',
      waitingPods: 'button[data-test="waiting-pods"]',
      podTrafficStatus: 'div[data-test="pod-traffic-status',
    },
    monitoringTab: {
      viewMonitoringDashBoardLink: '[data-test="observe-dashboard-link"]',
    },
    releaseNotesTab: {},
  },
  addStorage: {
    pvc: {
      useExistingClaim: 'input[value="existing"]',
      createNewClaim: {
        newClaim: 'input[value="new]',
        storageClass: '#storageclass-dropdown',
        pvcName: '#pvc-name',
        accessMode: {
          singleUser: 'input[value="ReadWriteOnce"]',
          sharedAccess: 'inputp[value="ReadWriteMany"]',
          readOnly: 'input[value="ReadOnlyMany"]',
          size: '#request-size-input',
          showLabelSelector: 'input[name="showLabelSelector"]',
        },
        volumeMode: {
          fileSystem: 'input[value="Filesystem"]',
          block: 'input[value="Block"]',
          devicePath: '#device-path',
        },
      },
    },
    mountPath: '#mount-path',
    subPath: '#subpath',
    mountAsReadOnly: 'input[name="mountAsReadOnly"]',
    save: '#save-changes',
  },
  revisionDetails: {
    detailsTab: '[data-test-id="horizontal-link-Details"]',
    yamlTab: '[data-test-id="horizontal-link-YAML"]',
    details: {
      resourceSummaryTitle: '[data-test-section-heading="Revision Details"]',
      resourceSummary: '[data-test-id="resource-summary"]',
      conditionsTitle: '[data-test-section-heading="Conditions"]',
    },
    yaml: {
      save: '[data-test="save-changes"]',
      reload: '[data-test="reload-object"]',
      cancel: '[data-test="cancel"]',
    },
  },
  highlightNode: '.is-filtered',
  createSecret: {
    advancedOptions: '.pf-c-expandable-section__toggle-text',
    secretForm: '.co-create-secret-form.modal-content',
    createSecretButton: 'button.pf-c-button.pf-m-link.pf-m-link--align-left',
    secretDropDown: '[id="form-ns-dropdown-formData-imagePullSecret-field"]',
    secretDropDownItem: '[data-test="dropdown-menu-item-link"]',
    formInputs: {
      secretFormTitle: '[data-test-id="modal-title"]',
      secretName: '[id="secret-name"]',
      authenticationType: '[data-test-id="dropdown-button"]',
      imageRegistryCredentials: '[data-test-dropdown-menu="credentials"]',
      uploadConfigurationFile: '[data-test-dropdown-menu="config-file"]',
      registryServerAddress: 'input[name="address"]',
      userName: 'input[name="username"]',
      password: 'input[name="password"]',
      email: 'input[name="email"]',
      saveSecret: '[data-test="confirm-action"]',
      reloadForm: '[data-test-id="reset-button"]',
      cancelAction: '[data-test-id="cancel-button"]',
    },
  },
  resourceLimits: {
    requestCPU: '[aria-describedby="form-resource-limit-limits-cpu-request-field-helper"]',
    limitCPU: '[aria-describedby="form-resource-limit-limits-cpu-limit-field-helper"]',
    requestMemory: '[aria-describedby="form-resource-limit-limits-memory-request-field-helper"]',
    limitMemory: '[aria-describedby="form-resource-limit-limits-memory-limit-field-helper"]',
  },
  deploymentStrategy: {
    strategyTypeDropDown: 'button[id="form-dropdown-formData-deploymentStrategy-type-field"]',
    recreateStrategy: 'button[id="Recreate-link"]',
    rollingUpdate: 'button[id="RollingUpdate-link"]',
    customUpdate: 'button[id="Custom-link"]',
    maxUnavailablePods: 'input[name="formData.deploymentStrategy.rollingUpdate.maxUnavailable"]',
    maxSurgePods: 'input[name="formData.deploymentStrategy.rollingUpdate.maxSurge"]',
    projectDropDown: '[id="form-ns-dropdown-formData-imageStream-namespace-field"]',
    imageStream: '[id="form-ns-dropdown-formData-imageStream-image-field"]',
    tag: '[id="form-dropdown-formData-imageStream-tag-field"]',
    envRow: '[data-test="pairs-list-row"]',
    envName: '[data-test="pairs-list-name"]',
    envValue: '[data-test="pairs-list-value"]',
    advancedOptions: 'button.pf-c-button.pf-m-link.pf-m-inline',
    pauseRolloutsCheckbox: '[id="form-checkbox-formData-paused-field"]',
    enterReplica: 'input[id="form-number-spinner-formData-replicas-field"]',
    saveEdit: '[data-test-id="submit-button"]',
    selectSecret: '[id="form-ns-dropdown-formData-imagePullSecret-field"]',
    dropdownSecret: '[data-test-id="dropdown-text-filter"]',
    timeout:
      'input[id="form-input-formData-deploymentStrategy-recreateParams-timeoutSeconds-field"]',
    deployImageCheckbox: 'input[name="formData.fromImageStreamTag"]',
    imageName: 'input[name="formData.imageName"]',
    preLifecycleHook: {
      preExecNewPod:
        'input[id="form-radiobutton-formData-deploymentStrategy-recreateParams-pre-action-execNewPod-field"]',
      preExecNewPodContainerDD:
        '[id="form-dropdown-formData-deploymentStrategy-recreateParams-pre-lch-execNewPod-containerName-field"]',
      runCommand:
        '[id="form-input-formData-deploymentStrategy-recreateParams-pre-lch-execNewPod-command-0-field"]',
      preTagImagesField:
        'input[id="form-radiobutton-formData-deploymentStrategy-recreateParams-pre-action-tagImages-field"]',
      preTagImagesFieldContainerDD:
        '[id="form-dropdown-formData-deploymentStrategy-imageStreamData-pre-containerName-field"]',
      projectDropDown:
        'button[id="form-ns-dropdown-formData-deploymentStrategy-imageStreamData-pre-imageStream-namespace-field"]',
      imageStream:
        'button[id="form-ns-dropdown-formData-deploymentStrategy-imageStreamData-pre-imageStream-image-field"]',
      imageStreamTag:
        'button[id="form-dropdown-formData-deploymentStrategy-imageStreamData-pre-imageStream-tag-field"]',
      failurePolicy:
        'button[id="form-dropdown-formData-deploymentStrategy-recreateParams-pre-lch-failurePolicy-field"]',
    },
    postLifecycleHook: {
      postExecNewPod:
        'input[id="form-radiobutton-formData-deploymentStrategy-recreateParams-post-action-execNewPod-field"]',
      postExecNewPodContainerNameDD:
        '[id="form-dropdown-formData-deploymentStrategy-recreateParams-post-lch-execNewPod-containerName-field"]',
      runCommand:
        'input[id="form-input-formData-deploymentStrategy-recreateParams-post-lch-execNewPod-command-0-field"]',
      postTagImagesField:
        'input[id="form-radiobutton-formData-deploymentStrategy-recreateParams-post-action-tagImages-field"]',
      postTagImagesFieldContainerDD:
        'button[id="form-dropdown-formData-deploymentStrategy-imageStreamData-post-containerName-field"]',
      projectDropDown:
        'button[id="form-ns-dropdown-formData-deploymentStrategy-imageStreamData-post-imageStream-namespace-field"]',
      imageStream:
        'button[id="form-ns-dropdown-formData-deploymentStrategy-imageStreamData-post-imageStream-image-field"]',
      imageStreamTag:
        'button[id="form-dropdown-formData-deploymentStrategy-imageStreamData-post-imageStream-tag-field"]',
      failurePolicy:
        'button[id="form-dropdown-formData-deploymentStrategy-recreateParams-post-lch-failurePolicy-field"]',
    },
    midLifecycleHook: {
      midExecNewPod:
        'input[id="form-radiobutton-formData-deploymentStrategy-recreateParams-mid-action-execNewPod-field"]',
      midContainerNameDropDown:
        'button[id="form-dropdown-formData-deploymentStrategy-recreateParams-mid-lch-execNewPod-containerName-field"]',
      runCommand:
        'id="form-input-formData-deploymentStrategy-recreateParams-mid-lch-execNewPod-command-0-field"',
      midTagImagesField:
        'input[id="form-radiobutton-formData-deploymentStrategy-recreateParams-mid-action-tagImages-field"]',
      midTagImagesFieldContainerDD:
        'button[id="form-dropdown-formData-deploymentStrategy-imageStreamData-mid-containerName-field"]',
      projectDropDown:
        'button[id="form-ns-dropdown-formData-deploymentStrategy-imageStreamData-mid-imageStream-namespace-field"]',
      imageStream:
        'button[id="form-ns-dropdown-formData-deploymentStrategy-imageStreamData-mid-imageStream-image-field"]',
      imageStreamTag:
        'button[id="form-dropdown-formData-deploymentStrategy-imageStreamData-mid-imageStream-tag-field"]',
      failurePolicy:
        'button[id="form-dropdown-formData-deploymentStrategy-recreateParams-mid-lch-failurePolicy-field"]',
    },
    tickButton: '[data-test-id="check-icon"]',
  },
  grouping: {
    addToApplication: '[data-test-action="add-to-application"]',
    importFromGitOption: '[data-test-action="Import from Git"]',
    filterResources: '[data-test="filter-by-resource"]',
    deploymentCheckbox: '[data-test="Deployment"]',
  },
  quickSearchPO: {
    listView: '[aria-label="List view"]',
    graphView: '[aria-label="Graph view"]',
    toggleView: '[data-test-id="topology-switcher-view"]',
    noResults: '[data-test="quick-search-no-results"]',
    quickstartDrawer: '[data-test="quickstart drawer"]',
    quickStarts: '#quickStarts',
    pageTitle: '[data-test="page-title"]',
    submitBtn: '[data-test-id="submit-button"]',
    samplePage: '#Samples',
    resourseTitle: '[data-test-id="resource-title"]',
    appformName: '[data-test-id="application-form-app-name"]',
    djangoPostgreSQL: '[data-test="item-name-Django + PostgreSQL-Templates"]',
    NETSample: '[data-test="item-name-.NET-Samples"]',
    monitorApp: '[data-test="item-name-Monitor your sample application-Quick Starts"]',
    nodejsDevfiles: '[data-test="item-name-Basic Node.js-Devfiles"]',
    nodejsSamples: '[data-test="item-name-Basic Node.js-Samples"]',
  },
  toolbarFilterPO: {
    deployment: '[data-test="Deployment"]',
    deploymentConfig: '[data-test="DeploymentConfig"]',
    deploymentSpan: '[data-test="Deployment"] span',
    deploymentConfigSpan: '[data-test="DeploymentConfig"] span',
    deploymentCheckbox: '[data-test="Deployment"] input',
    deploymentConfigCheckbox: '[data-test="DeploymentConfig"] input',
    deploymentApp: '#nodejs-ex-git-app-Deployment',
    deploymentConfigApp: '#nodejs-ex-git-app-DeploymentConfig',
  },
  displayFilter: {
    display: '.odc-topology-filter-dropdown__select',
    expandOption: '.odc-topology-filter-dropdown__expand-groups-switcher input',
    applicationGroupingOption: '.odc-topology-filter-dropdown__expand-groups-label input',
    unexpandedNode: '.odc-workload-node',
    disabledClass: '.pf-m-disabled',
    podLabelOptions: '.odc-topology-filter-dropdown__group input',
    podRingText: '.pod-ring__center-text',
    deploymentLabel: '#nodejs-ex-git-app-Deployment-label',
    deployemntCount: '.odc-topology-list-view__group-resource-count',
  },
  pipelines: {
    storageNav: '[data-quickstart-id="qs-nav-storage"]',
    pvcOption: '[href="/k8s/all-namespaces/persistentvolumeclaims"]',
    pvc: '[aria-label="PersistentVolumeClaims"]',
    startAction: '[data-test-action="Start"]',
    pvcIcon: '.co-m-resource-persistentvolumeclaim',
    addTriggerAction: '[data-test-action="Add Trigger"]',
    pipelineCheckbox: '#form-checkbox-pipeline-enabled-field',
    editWorkloadPage: '#content-scrollable',
    pipelineSection: '.odc-form-section-pipeline',
  },
};

export const typeOfWorkload = (workload: string) => {
  return `[data-id="odc-topology-graph"] .odc-resource-icon-${workload
    .toLowerCase()
    .replace(' ', '')
    .trim()}`;
};
