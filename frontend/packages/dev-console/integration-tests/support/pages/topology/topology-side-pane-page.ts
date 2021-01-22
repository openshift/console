import { topologyPO } from '../../pageObjects/topology-po';
import { topologyActions } from './topology-actions-page';
import { nodeActions } from '../../constants/topology';
import { modal } from '../../../../../integration-tests-cypress/views/modal';

export const topologySidePane = {
  verify: () => cy.get(topologyPO.sidePane.dialog).should('be.visible'),
  verifyTitle: (nodeName: string) => cy.get(topologyPO.sidePane.title).should('contain', nodeName),
  verifySelectedTab: (tabName: string) =>
    cy
      .get(topologyPO.sidePane.tabs)
      .contains(tabName)
      .parent('li')
      .should('have.class', 'co-m-horizontal-nav-item--active'),
  verifyTab: (tabName: string) =>
    cy
      .get(topologyPO.sidePane.tabs)
      .contains(tabName)
      .should('be.visible'),
  selectTab: (tabName: string) =>
    cy
      .get(topologyPO.sidePane.tabs)
      .contains(tabName)
      .click(),
  verifySection: (sectionTitle: string) =>
    cy
      .get(topologyPO.sidePane.sectionTitle)
      .contains(sectionTitle)
      .should('be.visible'),
  verifyActions: (...actions: string[]) => {
    cy.byLegacyTestID('action-items')
      .find('li')
      .each(($el) => {
        expect(actions).toContain($el.text());
      });
  },
  close: () =>
    cy
      .get('button[aria-label="Close"]')
      .scrollIntoView()
      .click(),
  verifyFieldinDetailsTab: (fieldName: string) =>
    cy.get(`[data-test-selector="details-item-label__${fieldName}"]`).should('be.visible'),
  verifyWorkload: () =>
    cy
      .get('[role="dialog"] h2')
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
  verifyWorkloadInAppSideBar: (workloadName: string) =>
    cy.get('[role="dialog"] a').should('contain.text', workloadName),
  selectNodeAction: (action: nodeActions | string) => {
    cy.byLegacyTestID('actions-menu-button').click();
    topologyActions.selectAction(action);
  },
  verifyLabel: (labelName: string) => {
    cy.get('dt[data-test-selector$="Labels"]').should('be.visible');
    cy.byButtonText('Edit').click();
    modal.shouldBeOpened();
    cy.get('span.tag-item__content')
      .contains(labelName)
      .scrollIntoView()
      .should('be.visible');
    cy.byLegacyTestID('modal-cancel-action').click();
    cy.get('form').should('not.exist');
  },
  verifyAnnotaiton: (annotationName: string) => {
    cy.byTestID('edit-annotations').click();
    cy.byTestID('label-list')
      .find('a')
      .contains(annotationName)
      .should('be.visible');
  },
  verifyNumberOfAnnotations: (num: string) => {
    cy.get('[data-test-selector="details-item-label__Annotations"]').should('be.visible');
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
    cy.get('[role="dialog"] li.list-group-item.pipeline-overview div button')
      .should('be.enabled')
      .click();
  },
  verifyPipelineRuns: () => {
    cy.get('li.odc-pipeline-run-item').should('be.visible');
  },
};
