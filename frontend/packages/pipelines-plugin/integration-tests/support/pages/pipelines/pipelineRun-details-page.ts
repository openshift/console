import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import {
  pipelineDetailsPO,
  pipelineRunDetailsPO,
  pipelineRunsPO,
} from '../../page-objects/pipelines-po';

export const pipelineRunDetailsPage = {
  verifyTitle: () => {
    cy.get(pipelineRunDetailsPO.details.sectionTitle).should(
      'have.text',
      pageTitle.PipelineRunDetails,
    );
    cy.testA11y('Pipeline Run Details page');
  },
  verifyPipelineRunStatus: (status: string) =>
    cy.get(pipelineRunDetailsPO.pipelineRunStatus).should('have.text', status),
  fieldDetails: (fieldName: string, expectedFieldValue: string) =>
    cy
      .get(pipelineRunDetailsPO.details.pipelineRunDetails)
      .contains(fieldName)
      .next('dd')
      .should('have.text', expectedFieldValue),
  selectFromActionsDropdown: (action: string) => {
    cy.get(pipelineRunDetailsPO.actions).click();
    switch (action) {
      case 'Rerun': {
        cy.byTestActionID('Rerun').click();
        cy.get(pipelineRunDetailsPO.details.sectionTitle).should('be.visible');
        break;
      }
      case 'Delete Pipeline Run': {
        cy.byTestActionID('Delete Pipeline Run').click();
        modal.modalTitleShouldContain('Delete Pipeline?');
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },
  verifyTabs: () => {
    cy.get(pipelineRunDetailsPO.detailsTab).should('have.text', 'Details');
    cy.get(pipelineRunDetailsPO.yamlTab).should('have.text', 'YAML');
    cy.get(pipelineRunDetailsPO.taskRunsTab).should('have.text', 'Task Runs');
    cy.get(pipelineRunDetailsPO.logsTab).should('have.text', 'Logs');
    cy.get(pipelineRunDetailsPO.eventsTab).should('have.text', 'Events');
  },
  verifyFields: () => {
    cy.get('[data-test-id="resource-summary"]').within(() => {
      cy.get(pipelineDetailsPO.details.fieldNames.name).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.namespace).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.labels).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.annotations).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.createdAt).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.owner).should('be.visible');
    });
    cy.get('.odc-pipeline-run-details__customDetails').within(() => {
      cy.get('dl dt')
        .eq(0)
        .should('have.text', 'Status');
      cy.get('dl dt')
        .eq(1)
        .should('have.text', 'Pipeline');
      cy.get('dl dt')
        .eq(2)
        .should('have.text', 'Triggered by:');
    });
  },
  verifyActionsDropdown: () => cy.get(pipelineRunDetailsPO.actions).should('be.visible'),
  selectPipeline: () => cy.get(pipelineRunDetailsPO.details.pipelineLink).click(),
  clickOnDownloadLink: () => cy.byButtonText('Download').click(),
  clickOnExpandLink: () => cy.byButtonText('Expand').click(),
  selectTab: (tabName: string) => {
    switch (tabName) {
      case 'Details': {
        cy.get(pipelineRunDetailsPO.detailsTab).click();
        pipelineRunDetailsPage.verifyTitle();
        break;
      }
      case 'YAML': {
        cy.get(pipelineRunDetailsPO.yamlTab).click();
        cy.get(pipelineRunDetailsPO.yaml.yamlPage).should('be.visible');
        break;
      }
      case 'Logs': {
        cy.get(pipelineRunDetailsPO.logsTab).click();
        cy.get(pipelineRunDetailsPO.logs.logPage).should('be.visible');
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },
};

export const pipelineRunsPage = {
  verifyTitle: () => detailsPage.titleShouldContain('Pipeline Runs'),
  search: (pipelineRunName: string) => cy.byLegacyTestID('item-filter').type(pipelineRunName),
  selectKebabMenu: (pipelineRunName: string) => {
    cy.get(pipelineRunsPO.pipelineRunsTable.table).should('exist');
    cy.get(pipelineRunsPO.pipelineRunsTable.pipelineRunName).each(($el, index) => {
      const text = $el.text();
      if (text.includes(pipelineRunName)) {
        cy.get('tbody tr')
          .eq(index)
          .find('td:nth-child(6) button')
          .click();
      }
    });
  },
  verifyPipelineRunsTableDisplay: () =>
    cy.get(pipelineRunsPO.pipelineRunsTable.table).should('be.visible'),
  filterByStatus: (status: string = 'Succeeded') => {
    cy.byLegacyTestID('filter-dropdown-toggle').click();
    switch (status) {
      case 'Succeeded': {
        cy.get('#Succeeded').click();
        break;
      }
      case 'Running': {
        cy.get('#Running').click();
        break;
      }
      case 'Failed': {
        cy.get('#Failed').click();
        break;
      }
      case 'Cancelled': {
        cy.get('#Cancelled').click();
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
    cy.byButtonText('Clear all filters').should('be.visible');
  },
  verifyStatusInPipelineRunsTable: (status: string) => {
    cy.get(pipelineRunsPO.pipelineRunsTable.status).should('have.text', status);
  },
};
