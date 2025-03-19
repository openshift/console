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
      .parent('.pf-v6-c-tabs__item')
      .should('have.class', 'pf-m-current'),
  verifyTab: (tabName: string) =>
    cy.get(topologyPO.sidePane.tabName).contains(tabName).should('be.visible'),
  verifyTabNotVisible: (tabName: string) =>
    cy.get(topologyPO.sidePane.tabName).contains(tabName).should('not.be.visible'),
  verifyActionsDropDown: () => cy.get(topologyPO.sidePane.actionsDropDown).should('be.visible'),
  clickActionsDropDown: () => cy.get(topologyPO.sidePane.actionsDropDown).click(),
  selectTab: (tabName: string) => {
    app.waitForLoad(160000, true);
    cy.get(topologyPO.sidePane.tabName).contains(tabName).click({ force: true });
  },
  verifySection: (sectionTitle: string) => {
    cy.get(topologyPO.sidePane.dialog).within(() => {
      cy.contains(topologyPO.sidePane.sectionTitle, sectionTitle).should('be.visible');
    });
  },
  verifyActions: (...actions: string[]) => {
    cy.byLegacyTestID('action-items')
      .find('li')
      .each(($el) => {
        expect(actions).toContain($el.text());
      });
  },
  close: () => cy.get(topologyPO.sidePane.close).scrollIntoView().click(),
  verifyFieldInDetailsTab: (fieldName: string) =>
    cy
      .get(`[data-test-selector="details-item-label__${fieldName}"]`)
      .scrollIntoView()
      .should('be.visible'),
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
  selectAddHealthChecks: () => cy.get('a').contains('Add Health Checks').click(),
  scaleUpPodCount: () => cy.get(topologyPO.sidePane.podScaleUP).click(),
  scaleDownPodCount: () => cy.get(topologyPO.sidePane.podScaleDown).click(),
  verifyPodText: (scaleNumber: string) => {
    cy.get(topologyPO.sidePane.podText, { timeout: 120000 }).should('contain.text', scaleNumber);
  },
  verifyHealthCheckAlert: () => cy.get(topologyPO.sidePane.healthCheckAlert).should('be.visible'),
  verifyResourceQuotaAlert: () =>
    cy.get(topologyPO.sidePane.resourceQuotaAlert).should('be.visible'),
  verifyWorkloadInAppSideBar: (workloadName: string) =>
    cy.get(topologyPO.sidePane.dialog).find('a').should('contain.text', workloadName),
  selectNodeAction: (action: nodeActions | string) => {
    cy.byLegacyTestID('actions-menu-button').click();
    topologyActions.selectAction(action);
  },
  verifyLabel: (labelName: string, timeout = 80000) => {
    cy.get(topologyPO.sidePane.detailsTab.labels)
      .contains(labelName, { timeout })
      .should('be.visible');
  },
  verifyAnnotation: (annotationName: string) => {
    cy.byTestID('edit-annotations').click();
    cy.byTestID('label-list')
      .find('a')
      .contains(annotationName, { timeout: 80000 })
      .should('be.visible');
  },
  verifyNumberOfAnnotations: (num: string) => {
    cy.wait(3000);
    cy.get(topologyPO.sidePane.detailsTab.annotations).scrollIntoView().should('be.visible');
    // eslint-disable-next-line promise/catch-or-return
    cy.get(topologyPO.sidePane.editAnnotations).then(($el) => {
      const res = $el.text().split(' ');
      expect(res[0]).toEqual(num);
    });
  },
  verifyResource: (resourceName: string) => {
    topologySidePane.selectTab('Resources');
    cy.byLegacyTestID(resourceName).should('be.visible');
  },
  clickStartLastRun: () => {
    cy.get(topologyPO.sidePane.resourcesTab.startLastRun).should('be.enabled').click();
  },
  verifyPipelineRuns: () => {
    cy.get(topologyPO.sidePane.resourcesTab.pipelineRuns).should('be.visible');
  },
  verifyResourcesApplication: (deploymentName: string) => {
    cy.byTestID(deploymentName).should('be.visible');
  },
  verifyActionsOnApplication: () => {
    cy.get(topologyPO.menuItemInContext).should('be.visible');
  },
  selectResource: (opt: resources | string, namespace: string, name: string) => {
    switch (opt) {
      case 'Deployments':
      case resources.Deployments: {
        cy.get(`[href="/k8s/ns/${namespace}/deployments/${name}"]`).click();
        break;
      }
      case 'Build Configs':
      case resources.BuildConfigs: {
        cy.get(`[href="/k8s/ns/${namespace}/buildconfigs/${name}"]`).click();
        break;
      }
      case 'Builds':
      case resources.Builds: {
        cy.get(`[href="/k8s/ns/${namespace}/builds/${name}"]`).click();
        break;
      }
      case 'Services':
      case resources.Services: {
        cy.get(`[href="/k8s/ns/${namespace}/services/${name}"]`).click();
        break;
      }
      case 'Image Streams':
      case resources.ImageStreams: {
        cy.get(`[href="/k8s/ns/${namespace}/imagestreams/${name}"]`).click();
        break;
      }
      case 'Routes':
      case resources.Routes: {
        cy.get(`[href="/k8s/ns/${namespace}/routes/${name}"]`).click();
        break;
      }
      default: {
        throw new Error('resource is not available');
      }
    }
  },
};
