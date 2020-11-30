export const topologyPO = {
  switcher: '.odc-topology__view-switcher > svg',
  graph: {
    reset: '#reset-view',
    zoomIn: '#zoom-in',
    zoomOut: '#zoom-out',
    fitToScreen: '#fit-to-screen',
  },
  list: {
    appName: '#HelmRelease ul li div',
    nodeName: '#HelmRelease ul li div',
  },
  sidePane: {
    dialog: '[role="dialog"]',
    title: '[role="dialog"] h1',
    tabs: '[role="dialog"] li button',
    sectionTitle: '[role="dialog"] h2',
    close: 'button[aria-label="Close"]',
    labelsList: '[data-test="label-list"]',
    editAnnotations: '[data-test-id="edit-annotations"]',
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
};
