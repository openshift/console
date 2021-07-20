export const topologyPO = {
  switcher: '[data-test-id="topology-switcher-view"]',
  noWorkLoadsText: 'h2.co-hint-block__title',
  title: 'h1.ocs-page-layout__title',
  search: '[data-test-id="item-filter"]',
  emptyStateIcon: 'div.pf-c-empty-state__icon',
  graph: {
    reset: '#reset-view',
    zoomIn: '#zoom-in',
    zoomOut: '#zoom-out',
    fitToScreen: '#fit-to-screen',
    emptyGraph: '[data-test-id="topology"]',
    filterDropdown: '[id^=pf-select-toggle-id]',
    nodeLabel: 'g.odc-base-node__label',
    knativeServiceNode: '[data-type="knative-service"]',
    eventSourceNode: '[data-type="event-source-link"]',
    contextMenu: '#popper-container ul',
    workloads: 'g[data-surface="true"]',
    node: '[data-test-id="base-node-handler"]',
    workload: '[data-type="workload"]',
    deleteWorkload: '[data-test="confirm-action"]',
    eventSourceWorkload: '[data-type="event-source"]',
    applicationGroupingTitle: '.odc-topology-list-view__application-label',
    addNewAnnotations: '[data-test="add-button"]',
    connector: '[data-test-id="edge-handler"]',
    displayOptions: {
      connenctivityMode: '[id="showGroups"]',
      consumptionMode: '[id="hideGroups"]',
      expandSwitchToggle: '.pf-c-switch__input',
      applicationGroupingsDisabled: '.pf-c-check.pf-c-select__menu-item.pf-m-disabled',
    },
    filterByResource: {
      filterByResourceDropDown: '.pf-c-select__toggle-text',
      deploymentResource: '.co-m-resource-icon.co-m-resource-deployment',
      deploymentConfigResource: '.co-m-resource-icon.co-m-resource-deploymentconfig',
    },
    contextMenuOptions: {
      addToProject: '.pf-topology-context-sub-menu',
    },
  },
  list: {
    appName: '#HelmRelease ul li div',
    nodeName: '#HelmRelease ul li div',
    resourceTitle: 'pf-c-data-list__cell.odc-topology-list-view__kind-label',
  },
  sidePane: {
    actionsDropDown: '[data-test-id="actions-menu-button"]',
    showPodCount: '[id$=show-pod-count]',
    dialog: '[role="dialog"]',
    title: '[role="dialog"] h1',
    tabs: '[role="dialog"] li button',
    sectionTitle: '[role="dialog"] h2.sidebar__section-heading',
    close: 'button[aria-label="Close"]',
    labelsList: '[data-test="label-list"]',
    editAnnotations: '[data-test="edit-annotations"]',
    tabName: '[role="dialog"] li button',
    healthCheckAlert: 'div.ocs-health-checks-alert',
    podScale: 'button.pf-c-button.pf-m-plain.pf-m-block',
    podText: 'text.pf-chart-donut-title.pod-ring__center-text',
    detailsTab: {
      labels: 'dt[data-test-selector$="Labels"]',
      annotations: '[data-test-selector="details-item-label__Annotations"]',
      labelsEdit: '[data-test="Labels-details-item__edit-button"]',
    },
    resourcesTab: {
      startLastRun: '[role="dialog"] li.list-group-item.pipeline-overview div button',
      pipelineRuns: 'li.odc-pipeline-run-item',
    },
    monitoringTab: {
      viewMonitoringDashBoardLink: '',
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
    requestCPU: 'input[name="limits.cpu.requestValue"]',
    limitCPU: 'input[name="limits.cpu.limitValue"]',
    requestMemory: 'input[name="limits.memory.requestValue"]',
    limitMemory: 'input[name="limits.memory.limitValue"]',
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
    envName: '[data-test="pairs-list-name"]',
    envValue: '[data-test="pairs-list-value"]',
    advancedOptions: 'button.pf-c-button.pf-m-link.pf-m-inline',
    pauseRolloutsCheckbox: '[id="form-checkbox-formData-paused-field"]',
    enterReplica: 'input[id="form-number-spinner-formData-replicas-field"]',
    saveEdit: '[data-test-id="submit-button"]',
    selectSecret: '[id="form-ns-dropdown-formData-imagePullSecret-field"]',
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
};
