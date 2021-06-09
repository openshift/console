import {
  displayOptions,
  nodeActions,
  sideBarTabs,
} from '@console/dev-console/integration-tests/support/constants';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { createHelmRelease, app } from '@console/dev-console/integration-tests/support/pages';
import { topologyHelper } from './topology-helper-page';

export const topologyPage = {
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
    cy.get(topologyPO.graph.emptyGraph).should('be.visible');
  },
  verifyTopologyGraphView: () => {
    return cy.get(topologyPO.graph.emptyGraph);
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
  clickDisplayOptionDropdown: () =>
    cy
      .get(topologyPO.graph.filterDropdown)
      .contains('Display Options')
      .click(),
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
      case displayOptions.ConnectivityMode:
        cy.get('#showGroups').click();
        break;
      case displayOptions.ConsumptionMode:
        cy.get('#hideGroups').click();
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
      .should('contain.text', sideBarTabs.details);
    cy.get(topologyPO.sidePane.tabName)
      .eq(1)
      .should('contain.text', sideBarTabs.resources);
    cy.get(topologyPO.sidePane.tabs)
      .eq(2)
      .should('contain.text', sideBarTabs.releaseNotes);
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
    return cy.get('g.odc-base-node__label > text').contains(nodeName);
  },
  getEventSource: (eventSource: string) => {
    return cy.get('[data-type="event-source"] g.odc-base-node__label > text').contains(eventSource);
  },
  getRevisionNode: (serviceName: string) => {
    cy.get('[data-type="knative-service"] g.odc-base-node__label > text')
      .contains(serviceName)
      .should('be.visible');
    return cy.get('[data-type="knative-revision"] circle[filter$="graph#NodeShadowsFilterId)"]');
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
  rightClickOnNode: (releaseName: string) => {
    topologyPage.getNode(releaseName).trigger('contextmenu', { force: true });
  },
  clickOnNode: (releaseName: string) => {
    topologyPage.getNode(releaseName).click({ force: true });
  },
  clickOnSinkBinding: (nodeName: string = 'sink-binding') => {
    topologyPage.getNode(nodeName).click({ force: true });
  },
  getKnativeService: (serviceName: string) => {
    return cy.get('[data-type="knative-service"]').contains(serviceName);
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
};
