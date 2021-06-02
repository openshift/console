import { modal } from '@console/cypress-integration-tests/views/modal';
import { nodeActions, resources } from '@console/dev-console/integration-tests/support/constants';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { app } from '@console/dev-console/integration-tests/support/pages';
import { topologyActions } from './topology-actions-page';

export const topologySidePane = {
  verify: () => cy.get(topologyPO.sidePane.dialog).should('be.visible'),
  verifyTitle: (nodeName: string) => cy.get(topologyPO.sidePane.title).should('contain', nodeName),
  verifySelectedTab: (tabName: string) =>
    cy
      .get(topologyPO.sidePane.tabName)
      .contains(tabName)
      .parent('li')
      .should('have.class', 'co-m-horizontal-nav-item--active'),
  verifyTab: (tabName: string) =>
    cy
      .get(topologyPO.sidePane.tabName)
      .contains(tabName)
      .should('be.visible'),
  verifyActionsDropDown: () => cy.get(topologyPO.sidePane.actionsDropDown).should('be.visible'),
  clickActionsDropDown: () => cy.get(topologyPO.sidePane.actionsDropDown).click(),
  selectTab: (tabName: string) =>
    cy
      .get(topologyPO.sidePane.tabName)
      .contains(tabName)
      .click(),
  verifySection: (sectionTitle: string) => {
    app.waitForLoad();
    cy.get(topologyPO.sidePane.sectionTitle)
      .contains(sectionTitle)
      .should('be.visible');
  },
  verifyActions: (...actions: string[]) => {
    cy.byLegacyTestID('action-items')
      .find('li')
      .each(($el) => {
        expect(actions).toContain($el.text());
      });
  },
  close: () =>
    cy
      .get(topologyPO.sidePane.close)
      .scrollIntoView()
      .click(),
  verifyFieldInDetailsTab: (fieldName: string) =>
    cy.get(`[data-test-selector="details-item-label__${fieldName}"]`).should('be.visible'),
  verifyWorkload: () =>
    cy
      .get(topologyPO.sidePane.sectionTitle)
      .contains('Services')
      .next('ul li a')
      .should('be.visible'),
  verifyFieldValue: (fieldName: string, fieldValue: string) =>
    cy
      .get(`[data-test-selector="details-item-value__${fieldName}"]`)
      .should('contain.text', fieldValue),
  selectAddHealthChecks: () =>
    cy
      .get('a')
      .contains('Add Health Checks')
      .click(),
  scaleUpPodCount: () =>
    cy
      .get(topologyPO.sidePane.podScale)
      .eq(0)
      .click(),
  scaleDownPodCount: () =>
    cy
      .get(topologyPO.sidePane.podScale)
      .eq(1)
      .click(),
  verifyPodText: (scaleNumber: string) =>
    cy.get(topologyPO.sidePane.podText).should('contain.text', scaleNumber),
  verifyHealthCheckAlert: () => cy.get(topologyPO.sidePane.healthCheckAlert).should('be.visible'),
  verifyWorkloadInAppSideBar: (workloadName: string) =>
    cy
      .get(topologyPO.sidePane.dialog)
      .find('a')
      .should('contain.text', workloadName),
  selectNodeAction: (action: nodeActions | string) => {
    cy.byLegacyTestID('actions-menu-button').click();
    topologyActions.selectAction(action);
  },
  verifyLabel: (labelName: string) => {
    cy.get(topologyPO.sidePane.detailsTab.labels).should('be.visible');
    cy.get(topologyPO.sidePane.detailsTab.labelsEdit).click();
    modal.shouldBeOpened();
    cy.get('span.tag-item__content')
      .contains(labelName)
      .scrollIntoView()
      .should('be.visible');
    cy.byLegacyTestID('modal-cancel-action').click();
    modal.shouldBeClosed();
  },
  verifyAnnotation: (annotationName: string) => {
    cy.byTestID('edit-annotations').click();
    cy.byTestID('label-list')
      .find('a')
      .contains(annotationName)
      .should('be.visible');
  },
  verifyNumberOfAnnotations: (num: string) => {
    cy.get(topologyPO.sidePane.detailsTab.annotations).should('be.visible');
    // eslint-disable-next-line promise/catch-or-return
    cy.get(topologyPO.sidePane.editAnnotations).then(($el) => {
      const res = $el.text().split(' ');
      expect(res[0]).toEqual(num);
    });
  },
  verifyResource: (resourceName: string) => {
    cy.get(topologyPO.sidePane.tabs)
      .contains('Resources')
      .click();
    cy.byLegacyTestID(resourceName).should('be.visible');
  },
  clickStartLastRun: () => {
    cy.get(topologyPO.sidePane.resourcesTab.startLastRun)
      .should('be.enabled')
      .click();
  },
  verifyPipelineRuns: () => {
    cy.get(topologyPO.sidePane.resourcesTab.pipelineRuns).should('be.visible');
  },
  selectResource: (opt: resources | string, namespace: string) => {
    switch (opt) {
      case 'Deployment Configs':
      case resources.DeploymentConfigs: {
        cy.get(`[href="/k8s/ns/${namespace}/deploymentconfigs/nodejs-example"]`).click();
        break;
      }
      case 'Build Configs':
      case resources.BuildConfigs: {
        cy.get(`[href="/k8s/ns/${namespace}/buildconfigs/nodejs-example"]`).click();
        break;
      }
      case 'Services':
      case resources.Services: {
        cy.get(`[href="/k8s/ns/${namespace}/services/nodejs-example"]`).click();
        break;
      }
      case 'Image Streams':
      case resources.ImageStreams: {
        cy.get(`[href="/k8s/ns/${namespace}/imagestreams/nodejs-example"]`).click();
        break;
      }
      case 'Routes':
      case resources.Routes: {
        cy.get(`[href="/k8s/ns/${namespace}/routes/nodejs-example"]`).click();
        break;
      }
      default: {
        throw new Error('resource is not available');
      }
    }
  },
};
