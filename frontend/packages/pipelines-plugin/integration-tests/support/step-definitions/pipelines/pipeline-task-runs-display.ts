import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  pageTitle,
} from '@console/dev-console/integration-tests/support/constants';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { pipelineActions } from '../../constants';
import {
  pipelineRunDetailsPO,
  pipelinesPO,
  pipelineDetailsPO,
} from '../../page-objects/pipelines-po';
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

Given(
  'user is at PipelineRuns tab with pipeline runs for pipeline {string}',
  (pipelineName: string) => {
    detailsPage.titleShouldContain(pageTitle.Pipelines);
    pipelinesPage.selectPipeline(pipelineName);
    cy.get(pipelineDetailsPO.pipelineRunsTab).click();
  },
);

When('user clicks on Pipeline Run for {string}', (pipelineName: string) => {
  cy.get(`[data-test-id^="${pipelineName}"]`).click();
});

When('user clicks kebab menu of a task run', () => {
  cy.get(pipelinesPO.pipelinesTable.kebabMenu).click();
});

When('user clicks on TaskRuns tab', () => {
  cy.get(pipelineRunDetailsPO.taskRunsTab).click();
});

Then('user can see kebab menu option Delete TaskRun', () => {
  cy.get('[data-test-action="Delete TaskRun"]').should('be.visible');
});

Then('user can see Status and Pods in Details tab', () => {
  cy.contains('.co-resource-item', 'Pod').should('be.visible');
  cy.byTestID('status-text').should('be.visible');
});

Then('user can see Details, Log, YAML and Events tab', () => {
  cy.get(pipelineRunDetailsPO.taskRunsDetails.columnNames.details).should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRunsDetails.columnNames.logs).should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRunsDetails.columnNames.YAML).should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRunsDetails.columnNames.events).should('be.visible');
});

Then('user is redirected to Task Run Details tab', () => {
  cy.get('.pf-c-breadcrumb').should('include.text', 'TaskRun details');
});

When('user clicks on task run {string}', (pipelineRunsName: string) => {
  cy.get(`[data-test-id^="${pipelineRunsName}-"]`)
    .eq(0)
    .click();
});

Given('user is at pipeline details page with pipeline runs {string}', (pipelineName: string) => {
  detailsPage.titleShouldContain(pageTitle.Pipelines);
  pipelinesPage.selectPipeline(pipelineName);
  cy.get('.pf-c-breadcrumb').should('include.text', 'Pipeline details');
});

When('user clicks on pipeline runs tab', () => {
  cy.get(pipelineDetailsPO.pipelineRunsTab).click();
});

Given(
  'user is at pipeline details page with pipeline runs for failed task run in {string} namespace',
  (namespace: string) => {
    cy.exec(
      `oc apply -f testData/pipelines-workspaces/sum-and-multiply-pipeline/pipeline-failed-task.yaml -n ${namespace}`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function(result) {
      cy.log(result.stdout);
    });
  },
);

Then('user can see Status, Message and Log snippet in Details tab', () => {
  cy.get(pipelineRunDetailsPO.taskRunsDetails.status)
    .contains('Status')
    .should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRunsDetails.status)
    .contains('Message')
    .should('be.visible');
  cy.get(pipelineRunDetailsPO.taskRunsDetails.status)
    .contains('Log snippet')
    .should('be.visible');
});

Given(
  'pipeline run with passed task run is displayed for {string} namespace',
  (namespace: string) => {
    cy.exec(
      `oc apply -f testData/pipelines-workspaces/sum-and-multiply-pipeline/passed-task-run-results.yaml -n ${namespace}`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function(result) {
      cy.log(result.stdout);
    });
  },
);

When('user scrolls to the Task Run results section', () => {
  cy.get('[data-test-section-heading="TaskRun results"]');
});

When('user clicks on pipeline runs tab for pipeline {string}', (pipelineName: string) => {
  cy.get(`[data-test-id^="${pipelineName}"]`).click();
  pipelineDetailsPage.selectTab('Pipeline Runs');
});

When('user clicks on Pipeline Run {string}', (pipelineRunsName: string) => {
  cy.get(`[data-test-id^="${pipelineRunsName}"]`).click();
});

Then('user can see Name and Value column under Task Run results', () => {
  cy.get('[role="grid"]')
    .contains('Name')
    .should('be.visible');
  cy.get('[role="grid"]')
    .contains('Value')
    .should('be.visible');
});
