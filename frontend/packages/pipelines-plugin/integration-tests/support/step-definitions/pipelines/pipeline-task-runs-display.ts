import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { pipelineActions } from '../../constants';
import { pipelineRunDetailsPO, pipelinesPO } from '../../page-objects/pipelines-po';
import { pipelinesPage, startPipelineInPipelinesPage } from '../../pages';
import { pipelineDetailsPage } from '../../pages/pipelines/pipelineDetails-page';
import { pipelineRunDetailsPage } from '../../pages/pipelines/pipelineRun-details-page';

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

Given(
  'pipeline {string} is executed with workspace type {string}',
  (pipelineName: string, workspaceType: string) => {
    pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
    modal.modalTitleShouldContain('Start Pipeline');
    startPipelineInPipelinesPage.selectWorkSpace(workspaceType);
    switch (workspaceType) {
      case 'PersistentVolumeClaim':
        cy.exec(
          `oc apply -f "testData/pipelines-workspaces/pipeline-persistentVolumeClaim.yaml" -n ${Cypress.env(
            'NAMESPACE',
          )}`,
        );
        startPipelineInPipelinesPage.selectPVC('shared-task-storage');
        break;
      case 'Config Map':
        cy.exec(
          `oc apply -f "testData/pipelines-workspaces/pipeline-configMap.yaml" -n ${Cypress.env(
            'NAMESPACE',
          )}`,
        );
        startPipelineInPipelinesPage.selectConfigMap('sensitive-recipe-storage');
        break;
      case 'Secret':
        cy.exec(
          `oc apply -f "testData/pipelines-workspaces/pipeline-secret.yaml" -n ${Cypress.env(
            'NAMESPACE',
          )}`,
        );
        startPipelineInPipelinesPage.selectSecret('secret-password');
        break;
      default:
        cy.log(`user selected ${workspaceType} as workspace`);
    }
    startPipelineInPipelinesPage.clickStart();
    pipelineRunDetailsPage.verifyTitle();
    navigateTo(devNavigationMenu.Pipelines);
    pipelinesPage.search(pipelineName);
    cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
  },
);

Given('user is at Task Runs tab of pipeline run with all kind of Workspaces', () => {
  // pipelinesPage.selectPipelineRun(pipelineName);
  pipelineRunDetailsPage.selectTab('TaskRuns');
});
