import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import { pipelineActions } from '../../constants';
import {
  pipelineDetailsPO,
  pipelineRunDetailsPO,
  pipelineRunsPO,
} from '../../page-objects/pipelines-po';
import { actionsDropdownMenu } from '../functions/common';

export const pipelineRunDetailsPage = {
  verifyTitle: () => {
    cy.contains(pageTitle.PipelineRunDetails).should('be.visible');
    cy.testA11y(`${pageTitle.PipelineRunDetails} page`);
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
    actionsDropdownMenu.clickActionMenu();
    switch (action) {
      case 'Rerun': {
        cy.byTestActionID(pipelineActions.Rerun).click();
        cy.get(pipelineRunDetailsPO.details.sectionTitle).should('be.visible');
        break;
      }
      case 'Delete Pipeline Run': {
        cy.byTestActionID(pipelineActions.DeletePipelineRun).click();
        modal.modalTitleShouldContain('Delete Pipeline?');
        break;
      }
      default: {
        throw new Error(`${action} is not available in dropdown menu`);
      }
    }
  },
  verifyTabs: () => {
    cy.get(pipelineRunDetailsPO.detailsTab).should('be.visible');
    cy.get(pipelineRunDetailsPO.yamlTab).should('be.visible');
    cy.get(pipelineRunDetailsPO.taskRunsTab).should('be.visible');
    cy.get(pipelineRunDetailsPO.logsTab).should('be.visible');
    cy.get(pipelineRunDetailsPO.eventsTab).should('be.visible');
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
      case 'Events': {
        cy.get(pipelineRunDetailsPO.eventsTab).click();
        cy.url().should('include', 'events');
        break;
      }
      case 'Task Runs': {
        cy.get(pipelineRunDetailsPO.taskRunsTab).click();
        cy.url().should('include', 'task-runs');
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },
  verifyWorkspacesSection: () => {
    cy.get(pipelineRunDetailsPO.details.workspacesSection)
      .scrollIntoView()
      .should('be.visible');
  },
};

export const pipelineRunsPage = {
  verifyTitle: () => detailsPage.titleShouldContain(pageTitle.PipelineRuns),
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
    cy.byLegacyTestID('filter-dropdown-toggle')
      .find('button')
      .click();
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
    cy.byLegacyTestID('filter-dropdown-toggle')
      .find('button')
      .click();
  },
  verifyStatusInPipelineRunsTable: (status: string) => {
    cy.get(pipelineRunsPO.pipelineRunsTable.status).should('have.text', status);
  },
};
