import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import {
  devNavigationMenu,
  displayOptions,
  nodeActions,
  sideBarTabs,
} from '@console/dev-console/integration-tests/support/constants';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  createHelmRelease,
  app,
  createForm,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages';
import { gitPage } from '@console/dev-console/integration-tests/support/pages/add-flow';
import { topologyHelper } from './topology-helper-page';

export const topologyPage = {
  verifyUserIsInGraphView: () => {
    cy.byLegacyTestID('topology-view-shortcuts').should('be.visible');
    // eslint-disable-next-line promise/catch-or-return
    cy.get('body').then(($body) => {
      if ($body.find('.odc-topology-list-view').length !== 0) {
        cy.get(topologyPO.switcher)
          .should('be.enabled')
          .click({ force: true });
        cy.get(topologyPO.graph.fitToScreen).should('be.visible');
      }
    });
  },
  verifyUserIsInListView: () => {
    cy.byLegacyTestID('topology-view-shortcuts').should('be.visible');
    // eslint-disable-next-line promise/catch-or-return
    cy.get('body').then(($body) => {
      if ($body.find('.odc-topology-graph-view').length !== 0) {
        cy.get(topologyPO.switcher)
          .should('be.enabled')
          .click({ force: true });
        cy.get(topologyPO.list.switchGraph).should('be.visible');
      }
    });
  },
  waitForLoad: (timeout = 50000) => {
    app.waitForLoad();
    cy.get('.loading-box.loading-box__loaded', { timeout }).should('exist');
    cy.get('[data-surface="true"]').should('be.visible');
  },
  verifyTitle: () => {
    cy.get(topologyPO.title).should('have.text', 'Topology');
  },
  verifyTopologyPage: () => {
    app.waitForDocumentLoad();
    cy.url().should('include', 'topology');
  },
  verifyTopologyGraphView: () => {
    // eslint-disable-next-line promise/catch-or-return
    cy.url().then(($text) => {
      $text.includes('graph')
        ? cy.log(`user is at topology graph view`)
        : cy.get(topologyPO.switcher).click({ force: true });
    });
  },
  verifyContextMenu: () => cy.get(topologyPO.graph.contextMenu).should('be.visible'),
  verifyNoWorkLoadsText: (text: string) =>
    cy.get('h3.pf-c-title.pf-m-lg').should('contain.text', text),
  verifyWorkLoads: () => cy.get(topologyPO.graph.workloads).should('be.visible'),
  search: (name: string) => {
    topologyHelper.search(name);
  },
  verifyWorkloadInTopologyPage: (appName: string) => {
    topologyHelper.verifyWorkloadInTopologyPage(appName);
  },
  verifyWorkloadNotInTopologyPage: (appName: string, options?: { timeout: number }) => {
    topologyHelper.verifyWorkloadDeleted(appName, options);
  },
  clickDisplayOptionDropdown: () =>
    cy
      .get('.odc-topology-filter-dropdown__select')
      .contains('Display options')
      .click(),
  checkConnectivityMode: () => cy.get(topologyPO.graph.displayOptions.connectivityMode).click(),
  checkConsumptionMode: () => cy.get(topologyPO.graph.displayOptions.consumptionMode).click(),
  verifyConnectivityModeChecked: () =>
    cy.get(topologyPO.graph.displayOptions.connectivityMode).should('be.checked'),
  verifyConsumptionModeChecked: () =>
    cy.get(topologyPO.graph.displayOptions.consumptionMode).should('be.checked'),
  verifyExpandChecked: () =>
    cy.get(topologyPO.graph.displayOptions.expandSwitchToggle).should('be.checked'),
  verifyExpandDisabled: () =>
    cy.get(topologyPO.graph.displayOptions.expandSwitchToggle).should('be.disabled'),
  verifyExpandOptionsDisabled: () =>
    cy.get(topologyPO.graph.displayOptions.applicationGroupings).should('be.disabled'),
  uncheckExpandToggle: () => {
    cy.get(topologyPO.graph.displayOptions.expandSwitchToggle).click({ force: true });
  },
  defaultState: () => {
    // By Default: Graph View
    topologyPage.verifyTopologyGraphView();

    // eslint-disable-next-line promise/catch-or-return
    cy.get('body').then((el) => {
      if (el.find(topologyPO.displayFilter.applicationGroupingOption).length === 0) {
        cy.get(topologyPO.displayFilter.display).click();
      }
    });

    // By Default: Expand Enabled
    // eslint-disable-next-line promise/catch-or-return
    cy.get(topologyPO.displayFilter.expandOption)
      .as('radiobutton')
      .invoke('is', ':checked')
      .then((initial) => {
        if (!initial) {
          cy.get('@radiobutton').check({ force: true });
        }
      });

    // By Default: ApplicationGroupings Checked
    // eslint-disable-next-line promise/catch-or-return
    cy.get(topologyPO.displayFilter.applicationGroupingOption)
      .as('checkbox')
      .invoke('is', ':checked')
      .then((initial) => {
        if (!initial) {
          cy.get('@checkbox').check({ force: true });
        }
      });

    // By Default: PodCount Unchecked
    // eslint-disable-next-line promise/catch-or-return
    cy.get(topologyPO.displayFilter.podLabelOptions)
      .eq(2)
      .as('checkbox')
      .invoke('is', ':checked')
      .then((initial) => {
        if (initial) {
          cy.get('@checkbox').uncheck({ force: true });
        }
      });

    // By Default: Labels Checked
    // eslint-disable-next-line promise/catch-or-return
    cy.get(topologyPO.displayFilter.podLabelOptions)
      .eq(3)
      .as('checkbox')
      .invoke('is', ':checked')
      .then((initial) => {
        if (!initial) {
          cy.get('@checkbox').check({ force: true });
        }
      });
  },
  verifyPodCountUnchecked: () => cy.get(topologyPO.sidePane.showPodCount).should('not.be.checked'),
  selectDisplayOption: (opt: displayOptions) => {
    topologyPage.clickDisplayOptionDropdown();
    switch (opt) {
      case displayOptions.PodCount:
        cy.get('[id$=show-pod-count]').check();
        break;
      case displayOptions.Labels:
        cy.get('[id$=show-labels]').check();
        break;
      case displayOptions.ApplicationGroupings:
        cy.get('[id$=expand-app-groups]').check();
        break;
      case displayOptions.HelmReleases:
        cy.get('[id$=helmGrouping]').check();
        break;
      case displayOptions.KnativeServices:
        cy.get('[id$=knativeServices]').check();
        break;
      default:
        throw new Error('Option is not available');
        break;
    }
  },
  filterByResource: (resourceName: string) => {
    cy.get(topologyPO.graph.filterDropdown)
      .contains('Filter by Resource')
      .click();
    cy.get(`[id$="${resourceName}"]`).check();
  },
  verifyPipelineRunStatus: (status: string) =>
    cy
      .get('li.list-group-item.pipeline-overview')
      .next('li')
      .find('span.co-icon-and-text span')
      .should('have.text', status),
  searchHelmRelease: (name: string) => {
    topologyHelper.search(name);
    // eslint-disable-next-line promise/catch-or-return
    cy.get('[data-kind="node"]').then(($el) => {
      if ($el.find(topologyPO.highlightNode).length === 0) {
        createHelmRelease(name);
      } else {
        cy.log('Helm Release is already available');
      }
      topologyPage.verifyWorkloadInTopologyPage(name);
    });
  },
  verifyHelmReleaseSidePaneTabs: () => {
    cy.get(topologyPO.sidePane.tabName)
      .eq(0)
      .should('contain.text', sideBarTabs.Details);
    cy.get(topologyPO.sidePane.tabName)
      .eq(1)
      .should('contain.text', sideBarTabs.Resources);
    cy.get(topologyPO.sidePane.tabs)
      .eq(2)
      .should('contain.text', sideBarTabs.ReleaseNotes);
  },
  getAppNode: (appName: string) => {
    return cy.get(`[data-id="group:${appName}"] g.odc-resource-icon text`).contains('A');
  },
  getRoute: (nodeName: string) => {
    return cy
      .get('[data-test-id="base-node-handler"] > text')
      .contains(nodeName)
      .parentsUntil(topologyPO.graph.node)
      .next('a')
      .eq(2);
  },
  getBuild: (nodeName: string) => {
    return cy.get(`a[href="/k8s/ns/aut/builds/${nodeName}-1/logs"]`);
  },
  componentNode: (nodeName: string) => {
    return cy.get('g.pf-topology__node__label > text').contains(nodeName);
  },
  knativeNode: (nodeName: string) => {
    return cy.get('g.odc-knative-service__label > text').contains(nodeName);
  },
  getEventSource: (eventSource: string) => {
    return cy
      .get('[data-type="event-source"] g.pf-topology__node__label > text')
      .contains(eventSource);
  },
  getRevisionNode: (serviceName: string) => {
    cy.get('[data-type="knative-service"] g.pf-topology__group__label > text', { timeout: 80000 })
      .contains(serviceName)
      .should('be.visible');
    return cy.get('[data-type="knative-revision"] ellipse.pf-topology__node__background');
  },
  verifyContextMenuOptions: (...options: string[]) => {
    cy.get('#popper-container li[role="menuitem"]').each(($el) => {
      expect(options).toContain($el.text());
    });
  },
  verifyDecorators: (nodeName: string, numOfDecorators: number) =>
    topologyPage
      .componentNode(nodeName)
      .siblings('a')
      .should('have.length', numOfDecorators),
  selectContextMenuAction: (action: nodeActions | string) => {
    cy.byTestActionID(action)
      .should('be.visible')
      .click();
  },
  getNode: (nodeName: string) => {
    return cy
      .get(topologyPO.graph.nodeLabel)
      .should('be.visible')
      .contains(nodeName);
  },
  getNodeLabel: (nodeName: string) => {
    return cy
      .get(topologyPO.graph.selectNodeLabel)
      .should('be.visible')
      .contains(nodeName);
  },
  getKnativeNode: (nodeName: string) => {
    return cy
      .get(topologyPO.graph.knativeNodeLabel)
      .should('be.visible')
      .contains(nodeName);
  },
  getGroup: (groupName: string) => {
    return cy
      .get(topologyPO.graph.groupLabel)
      .should('be.visible')
      .contains(groupName);
  },
  getDeploymentNode: (nodeName: string) => {
    return cy
      .get(topologyPO.graph.nodeLabel)
      .should('be.visible')
      .contains(new RegExp(`Deployment.*${nodeName}`));
  },
  rightClickOnNode: (nodeName: string) => {
    topologyPage.getNode(nodeName).trigger('contextmenu', { force: true });
  },
  rightClickOnGroup: (releaseName: string) => {
    topologyPage.getGroup(releaseName).trigger('contextmenu', { force: true });
  },
  rightClickOnApplicationGroupings: (appName: string) => {
    const id = `[data-id="group:${appName}"]`;
    cy.get(id)
      .should('be.visible')
      .first()
      .trigger('contextmenu', { force: true });
  },
  clickOnNode: (nodeName: string) => {
    topologyPage.getNode(nodeName).click({ force: true });
  },
  clickOnNodeLabel: (nodeName: string) => {
    topologyPage.getNodeLabel(nodeName).click({ force: true });
  },
  clickOnGroup: (groupName: string) => {
    topologyPage.getGroup(groupName).click({ force: true });
  },
  clickOnDeploymentNode: (nodeName: string) => {
    topologyPage.getDeploymentNode(nodeName).click();
  },
  clickOnApplicationGroupings: (appName: string) => {
    const id = `[data-id="group:${appName}"] .odc-resource-icon-application`;
    cy.get(id)
      .next('text')
      .click({ force: true });
  },
  verifyApplicationGroupingsDeleted: (appName: string) => {
    cy.reload();
    app.waitForLoad();
    guidedTour.close();
    const id = `[data-id="group:${appName}"]`;
    cy.get(id, { timeout: 50000 }).should('not.exist');
  },
  verifyApplicationGroupings: (workloadName: string) => {
    cy.get(topologyPO.sidePane.applicationGroupingsTitle).should('be.visible');
    cy.byLegacyTestID(workloadName).should('be.visible');
  },
  clickOnSinkBinding: (nodeName: string = 'sink-binding') => {
    topologyPage.getNode(nodeName).click({ force: true });
  },
  getKnativeService: (serviceName: string) => {
    return cy
      .get('[data-type="knative-service"]')
      .find(topologyPO.graph.groupLabel)
      .contains(serviceName);
  },
  getKnativeRevision: (serviceName: string) => {
    return cy
      .get('[data-type="knative-revision"]')
      .find('g.odc-workload-node')
      .contains(serviceName);
  },
  waitForKnativeRevision: () => {
    cy.get(topologyPO.graph.node, { timeout: 300000 }).should('be.visible');
  },
  rightClickOnHelmWorkload: () => {
    cy.get(topologyPO.graph.node)
      .find('circle')
      .trigger('contextmenu', { force: true });
  },
  clickOnHelmWorkload: () => {
    cy.get(topologyPO.graph.node)
      .find('circle')
      .click({ force: true });
  },
  clickWorkloadUrl: (workloadName: string) => {
    cy.get('[data-type="workload"] text')
      .contains(workloadName)
      .parentsUntil(topologyPO.graph.node)
      .siblings('a')
      .first()
      .click({ force: true });
  },
  clickOnKnativeService: (knativeService: string) => {
    topologyPage.getKnativeService(knativeService).click({ force: true });
  },
  rightClickOnKnativeService: (knativeService: string) => {
    topologyPage.getKnativeService(knativeService).trigger('contextmenu', { force: true });
  },
  addStorage: {
    pvc: {
      clickUseExistingClaim: () => {
        cy.get(topologyPO.addStorage.pvc.useExistingClaim).check();
      },
      createNewClaim: {
        clickCreateNewClaim: () => {
          cy.get(topologyPO.addStorage.pvc.createNewClaim.newClaim).check();
        },
        selectStorageClass: (storageClass: string = 'standard') => {
          cy.get(topologyPO.addStorage.pvc.createNewClaim.storageClass).click();
          cy.byLegacyTestID('dropdown-text-filter').type(storageClass);
          cy.get('ul[role="listbox"]')
            .find('li')
            .contains(storageClass)
            .click();
        },
        enterPVCName: (name: string) => {
          cy.get(topologyPO.addStorage.pvc.createNewClaim.pvcName).type(name);
        },
        enterSize: (size: string) => {
          cy.get(topologyPO.addStorage.pvc.createNewClaim.accessMode.size).type(size);
        },
      },
    },
    enterMountPath: (mountPath: string) => {
      cy.get(topologyPO.addStorage.mountPath).type(mountPath);
    },
    clickSave: () => {
      cy.get(topologyPO.addStorage.save).click();
    },
  },
  revisionDetails: {
    clickOnDetailsTab: () => cy.get(topologyPO.revisionDetails.detailsTab).click(),
    clickOnYAMLTab: () => cy.get(topologyPO.revisionDetails.yamlTab).click(),
    details: {
      verifyRevisionSummary: () =>
        cy.get(topologyPO.revisionDetails.details.resourceSummary).should('be.visible'),
      verifyConditionsSection: () =>
        cy.get(topologyPO.revisionDetails.details.conditionsTitle).should('be.visible'),
    },
    yaml: {
      clickOnSave: () => cy.get(topologyPO.revisionDetails.yaml.save).click(),
    },
  },
  verifyRunTimeIconForContainerImage: (runTimeIcon: string) => {
    cy.get('[data-type="workload"] .is-filtered [data-test-id="base-node-handler"]')
      .find('image')
      .should('have.attr', 'xlink:href')
      .and('include', runTimeIcon);
  },
  deleteApplication: (appName: string) => {
    cy.get(topologyPO.graph.deleteApplication)
      .clear()
      .type(appName);
    cy.get(topologyPO.graph.deleteWorkload).click();
    cy.wait(15000);
  },
  verifyApplicationGroupingSidepane: () => {
    cy.get(topologyPO.sidePane.applicationGroupingsTitle).should('be.visible');
    cy.get(topologyPO.sidePane.resourcesTabApplicationGroupings).should('be.visible');
  },
  startBuild: () => {
    cy.get('button[data-test-id="start-build-action"]')
      .should('be.visible')
      .click({ force: true });
  },
  verifyNodeAlert: (nodeName: string) => {
    cy.get('[data-type="workload"]')
      .find('.pf-topology__node.pf-m-warning')
      .contains(nodeName);
  },
  verifyListNodeAlert: (nodeName: string) => {
    cy.get('.odc-topology-list-view__label-cell')
      .contains(nodeName)
      .parent()
      .find('div.odc-topology-list-view__alert-cell')
      .contains('Alerts:');
  },
  clickMaxZoomOut: () => {
    cy.get(topologyPO.graph.emptyGraph).click();
    cy.get(topologyPO.graph.reset).click();
    for (let i = 0; i < 5; i++) {
      cy.get(topologyPO.graph.zoomOut).click();
    }
  },
};

export const addGitWorkload = (
  gitUrl: string = 'https://github.com/sclorg/nodejs-ex.git',
  componentName: string = 'nodejs-ex-git',
  resourceType: string = 'Deployment',
) => {
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage(gitUrl);
  gitPage.enterComponentName(componentName);
  gitPage.selectResource(resourceType);
  createForm.clickCreate();
  app.waitForLoad();
};

export const topologyListPage = {
  clickOnApplicationGroupings: (appName: string) => {
    const id = `[data-test="group:${appName}"]`;
    cy.get(id).click({ force: true });
  },
};

export const createServiceBindingConnect = (
  bindingName: string = 'testing',
  senderNode: string,
  recieverNode: string,
) => {
  topologyPage.rightClickOnNode(senderNode);
  cy.byTestActionID('Create Service Binding')
    .should('be.visible')
    .click();
  cy.get('#form-input-name-field')
    .should('be.visible')
    .clear()
    .type(bindingName);
  cy.get('#form-ns-dropdown-service-field')
    .should('be.visible')
    .click();
  cy.get(`#${recieverNode}-link`)
    .should('be.visible')
    .click();
  cy.get('#confirm-action').click();
  navigateTo(devNavigationMenu.Add);
  navigateTo(devNavigationMenu.Topology);
  cy.get('[data-test-id="edge-handler"]', { timeout: 15000 }).should('be.visible');
};
