import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import {
  clusterTriggerBindingDetailsPO,
  eventListenerDetailsPO,
  pipelineDetailsPO,
  triggerTemplateDetailsPO,
} from '@console/dev-console/integration-tests/support/pageObjects';

export const pipelineDetailsPage = {
  verifyTitle: (pipelineName: string) => detailsPage.titleShouldContain(pipelineName),

  clickActionMenu: () => cy.byLegacyTestID('actions-menu-button').click(),

  selectPipelineRun: () => {
    cy.get(pipelineDetailsPO.pipelineRuns.pipelineRunIcon)
      .next('a')
      .click();
  },

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
    cy.byLegacyTestID('horizontal-link-details-page~Details').should('be.visible');
    cy.byLegacyTestID('horizontal-link-Metrics').should('be.visible');
    cy.byLegacyTestID('horizontal-link-details-page~YAML').should('be.visible');
    cy.byLegacyTestID('horizontal-link-Pipeline Runs').should('be.visible');
    cy.byLegacyTestID('horizontal-link-Parameters').should('be.visible');
    cy.byLegacyTestID('horizontal-link-Resources').should('be.visible');
  },

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

  verifyFieldsInDetailsTab: () => {
    cy.byTestID('Name').should('be.visible');
    cy.byTestID('Namespace').should('be.visible');
    cy.byTestID('Labels').should('be.visible');
    cy.byTestID('Annotations').should('be.visible');
    cy.byTestID('Created at').should('be.visible');
    cy.byTestID('Owner').should('be.visible');
    cy.get('.odc-dynamic-resource-link-list--addSpaceBelow')
      .find('dl dt')
      .should('contain.text', 'Tasks');
  },

  selectTriggerTemplateLink: () => cy.get(pipelineDetailsPO.details.triggerTemplateLink).click(),
};

export const triggerTemplateDetailsPage = {
  verifyPage: () =>
    cy.get(triggerTemplateDetailsPO.title).should('contain.text', pageTitle.TriggerTemplateDetails),
  verifyTabs: () => {
    cy.get('ul.co-m-horizontal-nav__menu li a').as('tabName');
    cy.get('@tabName')
      .eq(0)
      .should('have.text', 'Details');
    cy.get('@tabName')
      .eq(1)
      .should('have.text', 'YAML');
  },
  verifyFields: () => {
    cy.get('[data-test-id="resource-summary"] dt').as('fieldNames');
    cy.get('@fieldNames')
      .eq(0)
      .should('have.text', 'Name');
    cy.get('@fieldNames')
      .eq(1)
      .should('have.text', 'Namespace');
    cy.get('@fieldNames')
      .eq(2)
      .should('have.text', 'Labels');
    cy.get('@fieldNames')
      .eq(3)
      .should('have.text', 'Annotations');
    cy.get('@fieldNames')
      .eq(4)
      .should('have.text', 'Created at');
    cy.get('@fieldNames')
      .eq(5)
      .should('have.text', 'Owner');
    cy.contains('Pipelines').should('be.visible');
    cy.contains('Event Listeners').should('be.visible');
  },
  verifyActionsDropdown: () => cy.get(triggerTemplateDetailsPO.actions).should('be.visible'),
  selectEventListener: () => cy.get(triggerTemplateDetailsPO.details.eventListenerLink).click(),
};

export const eventListenerDetailsPage = {
  verifyPage: () =>
    cy.get(eventListenerDetailsPO.title).should('contain.text', pageTitle.EventListenerDetails),
  verifyTabs: () => {
    cy.get('ul.co-m-horizontal-nav__menu li a').as('tabName');
    cy.get('@tabName')
      .eq(0)
      .should('have.text', 'Details');
    cy.get('@tabName')
      .eq(1)
      .should('have.text', 'YAML');
  },
  verifyFields: () => {
    cy.get('[data-test-id="resource-summary"] dt').as('fieldNames');
    cy.get('@fieldNames')
      .eq(0)
      .should('have.text', 'Name');
    cy.get('@fieldNames')
      .eq(1)
      .should('have.text', 'Namespace');
    cy.get('@fieldNames')
      .eq(2)
      .should('have.text', 'Labels');
    cy.get('@fieldNames')
      .eq(3)
      .should('have.text', 'Annotations');
    cy.get('@fieldNames')
      .eq(4)
      .should('have.text', 'Created at');
    cy.get('@fieldNames')
      .eq(5)
      .should('have.text', 'Owner');
    cy.contains('Triggers').should('be.visible');
  },
  verifyActionsDropdown: () => cy.get(eventListenerDetailsPO.actions).should('be.visible'),
  selectTriggerBindingLink: () => cy.get(eventListenerDetailsPO.details.triggerBindingLink).click(),
};

export const clusterTriggerBindingDetailsPage = {
  verifyPage: () =>
    cy
      .get(clusterTriggerBindingDetailsPO.title)
      .should('contain.text', pageTitle.ClusterTriggerTemplateDetails),
  verifyTabs: () => {
    cy.get('ul.co-m-horizontal-nav__menu li a').as('tabName');
    cy.get('@tabName')
      .eq(0)
      .should('have.text', 'Details');
    cy.get('@tabName')
      .eq(1)
      .should('have.text', 'YAML');
  },
  verifyFields: () => {
    cy.get('[data-test-id="resource-summary"] dt .details-item__label').as('fieldNames');
    cy.get('@fieldNames')
      .eq(0)
      .should('have.text', 'Name');
    cy.get('@fieldNames')
      .eq(1)
      .should('have.text', 'Labels');
    cy.get('@fieldNames')
      .eq(2)
      .should('have.text', 'Annotations');
    cy.get('@fieldNames')
      .eq(3)
      .should('have.text', 'Created At');
    cy.get('@fieldNames')
      .eq(4)
      .should('have.text', 'Owner');
  },
  verifyActionsDropdown: () => cy.get(clusterTriggerBindingDetailsPO.actions).should('be.visible'),
};
