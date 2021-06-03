import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import {
  clusterTriggerBindingDetailsPO,
  eventListenerDetailsPO,
  pipelineDetailsPO,
  triggerTemplateDetailsPO,
} from '../../page-objects/pipelines-po';

export const pipelineDetailsPage = {
  verifyTitle: (pipelineName: string) => detailsPage.titleShouldContain(pipelineName),

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
    cy.get(pipelineDetailsPO.resourcesTab).should('be.visible');
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

  selectTab: (tabName: string) => {
    cy.log(`Selecting the ${tabName} tab`);
    switch (tabName) {
      case 'Details': {
        cy.get(pipelineDetailsPO.detailsTab).click();
        cy.get(pipelineDetailsPO.details.sectionTitle).should('be.visible');
        break;
      }
      case 'YAML': {
        cy.get(pipelineDetailsPO.yamlTab).click();
        cy.get(pipelineDetailsPO.yaml.yamlEditor).should('be.visible');
        break;
      }
      case 'Pipeline Runs': {
        cy.get(pipelineDetailsPO.pipelineRunsTab).click();
        cy.url().should('include', 'Runs');
        break;
      }
      case 'Parameters': {
        cy.get(pipelineDetailsPO.parametersTab).click();
        cy.url().should('include', 'Parameters');
        break;
      }
      case 'Resources': {
        cy.get(pipelineDetailsPO.resourcesTab).click();
        cy.url().should('include', 'resources');
        break;
      }
      case 'Metrics': {
        cy.get(pipelineDetailsPO.metricsTab).click();
        cy.url().should('include', 'metrics');
        break;
      }
      default: {
        throw new Error(`tab doesn't exists, please check once again`);
      }
    }
  },

  selectPipelineRun: () => {
    cy.get(pipelineDetailsPO.pipelineRuns.pipelineRunIcon)
      .next('a')
      .click();
  },
  finallyNode: () => {
    return cy.get('[data-test="pipeline-visualization"] [data-test="finally-node"]');
  },
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
};
