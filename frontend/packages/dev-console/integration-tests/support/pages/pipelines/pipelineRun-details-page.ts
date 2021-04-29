import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants';
import {
  pipelineRunDetailsPO,
  pipelineRunsPO,
} from '@console/dev-console/integration-tests/support/pageObjects';

export const pipelineRunDetailsPage = {
  verifyTitle: () =>
    cy
      .get(pipelineRunDetailsPO.details.sectionTitle)
      .find('span')
      .should('have.text', pageTitle.PipelineRunDetails),
  waitForTaskRunToComplete: () => {
    pipelineRunDetailsPage.waitForTaskRunToComplete();
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
    cy.get('div dl dt').as('fieldNames');
    cy.get('@fieldNames')
      .eq(0)
      .should('have.text', 'Name');
    cy.get('@fieldNames')
      .eq(1)
      .should('have.text', 'Namespace');
    cy.get('@fieldNames')
      .eq(2)
      .find('button')
      .eq(0)
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
    cy.get('@fieldNames')
      .eq(6)
      .should('have.text', 'Status');
    cy.get('@fieldNames')
      .eq(7)
      .should('have.text', 'Pipeline');
    cy.get('@fieldNames')
      .eq(8)
      .should('have.text', 'Triggered by:');
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
