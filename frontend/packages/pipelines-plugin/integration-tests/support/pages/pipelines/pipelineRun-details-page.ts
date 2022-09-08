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
  waitForPipelineRunToComplete: () => {
    cy.get('.odc-pipeline-vis-task--icon-spin', { timeout: 120000 }).should('not.exist');
    cy.contains('Running', { timeout: 120000 }).should('not.exist');
  },
  verifyPipelineRunStatus: (status: string) => {
    pipelineRunDetailsPage.waitForPipelineRunToComplete();
    cy.get(pipelineRunDetailsPO.pipelineRunStatus, { timeout: 60000 }).then((actualStatus) => {
      if (actualStatus.text().includes('Failed')) {
        cy.get('dt')
          .contains('Message')
          .next('dd')
          .then((message) => {
            cy.log(`Pipeline Run status is failed with the following message: ${message.text()}`);
          });
        cy.get('dt')
          .contains('Log snippet')
          .next('dd pre')
          .then((logSnippet) => {
            cy.log(`Pipeline Run status is failed, the logs are as follows: ${logSnippet.text()}`);
          });
        expect(actualStatus.text()).toMatch(status);
      } else {
        expect(actualStatus.text()).toMatch(status);
      }
    });
  },
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
    cy.get(pipelineRunDetailsPO.parametersTab).should('be.visible');
  },
  verifyFields: () => {
    cy.byLegacyTestID('resource-summary').within(() => {
      cy.get(pipelineDetailsPO.details.fieldNames.name).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.namespace).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.labels).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.annotations).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.createdAt).should('be.visible');
      cy.get(pipelineDetailsPO.details.fieldNames.owner).should('be.visible');
    });
    cy.get('.odc-pipeline-run-details__customDetails').within(() => {
      cy.contains('dl dt', 'Status').should('be.visible');
      cy.contains('dl dt', 'Pipeline').should('be.visible');
      cy.contains('dl dt', 'Triggered by:').should('be.visible');
    });
  },
  verifyDetailsFields: () => {
    cy.get('.odc-pipeline-run-details__customDetails').within(() => {
      cy.contains('dl dt', 'Repository').should('be.visible');
      cy.contains('dl dt', 'Branch').should('be.visible');
      cy.contains('dl dt', 'Commit id').should('be.visible');
      cy.contains('dl dt', 'Event type').should('be.visible');
    });
  },
  verifyPipelineRunColumns: () => {
    cy.get(pipelineRunDetailsPO.taskRuns.columnNames.name).should('be.visible');
    cy.get(pipelineRunDetailsPO.taskRuns.columnNames.commidID).should('be.visible');
    cy.get(pipelineRunDetailsPO.taskRuns.columnNames.status).should('be.visible');
    cy.get(pipelineRunDetailsPO.taskRuns.columnNames.taskStatus).should('be.visible');
    cy.get(pipelineRunDetailsPO.taskRuns.columnNames.started).should('be.visible');
    cy.get(pipelineRunDetailsPO.taskRuns.columnNames.duration).should('be.visible');
    cy.get(pipelineRunDetailsPO.taskRuns.columnNames.branch).should('be.visible');
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
      case 'Parameters': {
        cy.get(pipelineRunDetailsPO.parametersTab).click();
        cy.url().should('include', 'parameters');
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
    cy.log(`user selects the kebab menu of pipeline : "${pipelineRunName}"`);
    cy.get(pipelineRunsPO.pipelineRunsTable.pipelineRunName).then(() => {
      cy.get('tbody tr')
        .first()
        .find('td:nth-child(6) button')
        .click({ force: true });
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
