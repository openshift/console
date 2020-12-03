import { displayOptions, nodeActions } from '../../constants/topology';
import { topologyPO } from '../../pageObjects/topology-po';
import { createHelmRelease } from '../functions/createHelmRelease';

export const topologyPage = {
  verifyTitle: () => {
    cy.get('h1.ocs-page-layout__title').should('have.text', 'Topology');
  },
  verifyTopologyPage: () => {
    cy.get('.co-m-loader', { timeout: 40000 }).should('not.exist');
    cy.get(topologyPO.graph.reset).should('be.visible');
  },
  verifyContextMenu: () => cy.get('#popper-container ul').should('be.visible'),
  verifyNoWorkLoadsText: (text: string) =>
    cy.get('h2.co-hint-block__title').should('contain.text', text),
  verifyWorkLoads: () => cy.get('g[data-surface="true"]').should('be.visible'),
  search: (name: string) =>
    cy
      .byLegacyTestID('item-filter')
      .clear()
      .type(name),
  verifyWorkloadInTopologyPage: (appName: string) => {
    cy.get(topologyPO.switcher).click();
    topologyPage.search(appName);
    cy.get('div.is-filtered').should('be.visible');
    cy.get(topologyPO.switcher).click();
  },
  clicKDisplayOptionDropdown: () =>
    cy
      .get('[id^=pf-select-toggle-id]')
      .contains('Display Options')
      .click(),
  selectDisplayOption: (opt: displayOptions) => {
    topologyPage.clicKDisplayOptionDropdown();
    switch (opt) {
      case displayOptions.PodCount:
        cy.get('#pf-random-id-1-show-pod-count').check();
        break;
      case displayOptions.Labels:
        cy.get('#pf-random-id-1-show-labels').check();
        break;
      case displayOptions.ApplicationGroupings:
        cy.get('#pf-random-id-1-expand-app-groups').check();
        break;
      default:
        throw new Error('Option is not available');
        break;
    }
  },
  filterByResource: (resourceName: string) => {
    cy.get('[id^=pf-select-toggle-id]')
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
    topologyPage.search(name);
    cy.get('[data-kind="node"]').then(($el) => {
      if ($el.find('g.is-filtered').length === 0) {
        createHelmRelease(name);
      } else {
        cy.log('Helm Release is already available');
      }
      cy.get('[data-kind="node"] g.is-filtered').should('be.visible');
    });
  },
  verifyHelmReleaseSidePaneTabs: () => {
    cy.get(topologyPO.sidePane.tabs)
      .eq(0)
      .should('contain.text', 'Details');
    cy.get(topologyPO.sidePane.tabs)
      .eq(1)
      .should('contain.text', 'Resources');
    cy.get(topologyPO.sidePane.tabs)
      .eq(2)
      .should('contain.text', 'Release Notes');
  },
  appNode: (appName: string) => {
    return cy.get(`[data-id="group:${appName}"] g.odc-resource-icon text`).contains('A');
  },
  getRoute: (nodeName: string) => {
    return cy
      .get('[data-test-id="base-node-handler"] > text')
      .contains(nodeName)
      .parentsUntil('[data-test-id="base-node-handler"]')
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
  revisionNode: (serviceName: string) => {
    return cy
      .get('g.odc-base-node__label > text')
      .contains(serviceName)
      .parentsUntil('[data-type="knative-service"]')
      .children('[data-type="knative-revision"] circle[filter$="graph#NodeShadowsFilterId)"]');
  },
  verifyContextMenuOptions: (...options: string[]) => {
    cy.get('#popper-container li[role="menuitem"]').each(($el) => {
      expect(options).toContain($el.text());
    });
  },
  clickContextMenuOption: (menuOption: string) =>
    cy.byTestActionID(menuOption).click({ force: true }),
  verifyDecorators: (nodeName: string, numOfDecorators: number) =>
    topologyPage
      .componentNode(nodeName)
      .siblings('a')
      .should('have.length', numOfDecorators),
  selectContextMenuAction: (action: nodeActions | string) =>
    cy
      .byTestActionID(action)
      .should('be.visible')
      .click(),
  rightClickOnNode: (releaseName: string) => {
    cy.get('g.odc-base-node__label')
      .should('be.visible')
      .contains(releaseName)
      .trigger('contextmenu', { force: true });
  },
  clickOnNode: (releaseName: string) => {
    cy.get('g.odc-base-node__label')
      .should('be.visible')
      .contains(releaseName)
      .click({ force: true });
  },
  clickOnSinkBinding: () => {
    cy.get('g.odc-base-node__label')
      .should('be.visible')
      .contains('sink-binding')
      .click({ force: true });
  },
  rightClickOnKnativeRevision: () => {
    cy.byLegacyTestID('base-node-handler')
      .find('g.odc-resource-icon')
      .trigger('contextmenu', { force: true });
  },
  clickOnKnativeRevision: () => {
    cy.byLegacyTestID('base-node-handler')
      .find('g.odc-resource-icon')
      .click({ force: true });
  },
  waitForKnativeRevision: () => {
    cy.get('[data-test-id="base-node-handler"]', { timeout: 300000 }).should('be.visible');
  },
  rightClickOnHelmWorkload: () => {
    cy.byLegacyTestID('base-node-handler')
      .find('circle')
      .trigger('contextmenu', { force: true });
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
};
