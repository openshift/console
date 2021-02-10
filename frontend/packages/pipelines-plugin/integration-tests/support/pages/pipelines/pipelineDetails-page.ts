import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import {
  clusterTriggerBindingDetailsPO,
  eventListenerDetailsPO,
  pipelineDetailsPO,
  triggerTemplateDetailsPO,
} from '../../page-objects/pipelines-po';

export const pipelineDetailsPage = {
  verifyTitle: (pipelineName: string) => detailsPage.titleShouldContain(pipelineName),

  clickActionMenu: () => cy.byLegacyTestID('actions-menu-button').click(),

  selectFromActionsDropdown: (action: string) => {
    cy.get(pipelineDetailsPO.actionsMenu)
      .should('be.enabled')
      .click();
    cy.byTestActionID(action).click();
  },

  verifyTriggerTemplateSection: () =>
    cy.get(pipelineDetailsPO.details.triggerTemplateSection).should('be.visible'),
  verifyPage: () =>
    cy.get(pipelineDetailsPO.title).should('contain.text', pageTitle.PipelineDetails),

  verifyTabs: () => {
    cy.get(pipelineDetailsPO.detailsTab).should('be.visible');
    cy.get(pipelineDetailsPO.metricsTab).should('be.visible');
    cy.get(pipelineDetailsPO.yamlTab).should('be.visible');
    cy.get(pipelineDetailsPO.pipelineRunsTab).should('be.visible');
    cy.get(pipelineDetailsPO.parametersTab).should('be.visible');
    cy.get(pipelineDetailsPO.ResourcesTab).should('be.visible');
  },

  verifyFieldsInDetailsTab: () => {
    cy.get(pipelineDetailsPO.details.fieldNames.name).should('be.visible');
    cy.get(pipelineDetailsPO.details.fieldNames.namespace).should('be.visible');
    cy.get(pipelineDetailsPO.details.fieldNames.labels).should('be.visible');
    cy.get(pipelineDetailsPO.details.fieldNames.annotations).should('be.visible');
    cy.get(pipelineDetailsPO.details.fieldNames.createdAt).should('be.visible');
    cy.get(pipelineDetailsPO.details.fieldNames.owner).should('be.visible');
    cy.get(pipelineDetailsPO.details.fieldNames.tasks).should('contain.text', 'Tasks');
  },

  selectTriggerTemplateLink: () => cy.get(pipelineDetailsPO.details.triggerTemplateLink).click(),
};

export const triggerTemplateDetailsPage = {
  verifyPage: () =>
    cy.get(triggerTemplateDetailsPO.title).should('contain.text', pageTitle.TriggerTemplateDetails),
  verifyTabs: () => {
    cy.get(triggerTemplateDetailsPO.detailsTab).should('be.visible');
    cy.get(triggerTemplateDetailsPO.yamlTab).should('be.visible');
  },
  verifyFields: () => {
    cy.get('[data-test-id="resource-summary"]').within(() => {
      cy.get(triggerTemplateDetailsPO.details.fieldNames.name).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.namespace).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.labels).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.annotations).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.createdAt).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.owner).should('be.visible');
      // Pipelines icon and eventListenerLink page objects needs to be identified
      // cy.document()
      //   .its('readyState')
      //   .should('eq', 'complete');
      // cy.get(triggerTemplateDetailsPO.details.pipelinesIcon).should('be.visible');
      // cy.get(triggerTemplateDetailsPO.details.eventListenerLink, { timeout: 10000 }).should(
      //   'be.visible',
      // );
    });
  },
  verifyActionsDropdown: () => cy.get(triggerTemplateDetailsPO.actions).should('be.visible'),
  selectEventListener: () => cy.get(triggerTemplateDetailsPO.details.eventListenerLink).click(),
};

export const eventListenerDetailsPage = {
  verifyPage: () =>
    cy.get(eventListenerDetailsPO.title).should('contain.text', pageTitle.EventListenerDetails),
  verifyTabs: () => {
    cy.get(triggerTemplateDetailsPO.detailsTab).should('be.visible');
    cy.get(triggerTemplateDetailsPO.yamlTab).should('be.visible');
  },
  verifyFields: () => {
    cy.get('[data-test-id="resource-summary"]').within(() => {
      cy.get(triggerTemplateDetailsPO.details.fieldNames.name).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.namespace).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.labels).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.annotations).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.createdAt).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.owner).should('be.visible');
      // triggerTemplateIcon icon page objects needs to be identified
      // cy.document()
      //   .its('readyState')
      //   .should('eq', 'complete');
      // cy.get(eventListenerDetailsPO.details.triggerTemplateIcon).should('be.visible');
    });
  },
  verifyActionsDropdown: () => cy.get(eventListenerDetailsPO.actions).should('be.visible'),
  selectTriggerBindingLink: () => cy.get(eventListenerDetailsPO.details.triggerBindingLink).click(),
};

export const clusterTriggerBindingDetailsPage = {
  verifyPage: () => {
    cy.get(clusterTriggerBindingDetailsPO.title).should(
      'contain.text',
      pageTitle.ClusterTriggerTemplateDetails,
    );
    cy.testA11y('Cluster Trigger Binding Details Page');
  },
  verifyTabs: () => {
    cy.get(triggerTemplateDetailsPO.detailsTab).should('be.visible');
    cy.get(triggerTemplateDetailsPO.yamlTab).should('be.visible');
  },
  verifyFields: () => {
    cy.get('[data-test-id="resource-summary"]').within(() => {
      cy.get(triggerTemplateDetailsPO.details.fieldNames.name).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.labels).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.annotations).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.createdAt).should('be.visible');
      cy.get(triggerTemplateDetailsPO.details.fieldNames.owner).should('be.visible');
    });
  },
  verifyActionsDropdown: () => cy.get(clusterTriggerBindingDetailsPO.actions).should('be.visible'),
};
