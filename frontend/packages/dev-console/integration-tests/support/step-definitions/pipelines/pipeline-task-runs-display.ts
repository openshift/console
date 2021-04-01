import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelineRunDetailsPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { pipelineDetailsPage } from '@console/dev-console/integration-tests/support/pages/pipelines/pipelineDetails-page';
import { pipelineRunDetailsPage } from '@console/dev-console/integration-tests/support/pages/pipelines/pipelineRun-details-page';

When('user clicks on Pipeline Runs tab', () => {
  pipelineDetailsPage.selectTab('Pipeline Runs');
});

When('user clicks on a Pipeline Run', () => {
  pipelineDetailsPage.selectPipelineRun();
  pipelineRunDetailsPage.verifyTitle();
});

When('user clicks on Task Runs tab', () => {
  pipelineRunDetailsPage.selectTab('Task Runs');
});

Then('user can see different task runs based on number of tasks executed in pipeline', () => {
  cy.get('[role="grid"]').should('be.visible');
});

Then('user can see Name, Task, Pod, Status and Started columns', () => {
  cy.get(pipelineRunDetailsPO.taskRuns.columnNames.name).should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRuns.columnNames.task).should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRuns.columnNames.pod).should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRuns.columnNames.status).should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRuns.columnNames.started).should('be.visible');
});
