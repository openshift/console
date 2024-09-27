import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  adminNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants';
import { navigateTo, topologySidePane } from '@console/dev-console/integration-tests/support/pages';
import { pipelineActions } from '../../constants';
import { pipelineBuilderPO, pipelinesPO } from '../../page-objects/pipelines-po';
import {
  pipelinesPage,
  pipelineBuilderPage,
  pipelineDetailsPage,
  pipelineRunDetailsPage,
} from '../../pages';
import { actionsDropdownMenu } from '../../pages/functions/common';

Given('pipeline with task {string} is present on Pipelines page', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
  navigateTo(devNavigationMenu.Pipelines);
});

When(
  'user selects {string} option from kebab menu of {string}',
  (kebabMenuOption: string, pipelineName: string) => {
    pipelinesPage.selectActionForPipeline(pipelineName, kebabMenuOption);
  },
);

When('user adds parallel task {string}', (taskName: string) => {
  pipelineBuilderPage.selectParallelTask(taskName);
});

When('user searches pipeline {string} in pipelines page', (pipelineName: string) => {
  pipelinesPage.search(pipelineName);
});

Then(
  'pipelines table displayed with column names Name, Last Run, Task Status, Last Run Status and Last Run Time',
  () => {
    pipelinesPage.verifyPipelineTableColumns();
  },
);

Then('pipelines column Name display with value {string}', (pipelineName: string) => {
  pipelinesPage.verifyNameInPipelinesTable(pipelineName);
});

Then(
  'columns Last Run, Task Run Status, Last Run Status, Last Run Time with values display {string}',
  (defaultValue: string) => {
    pipelinesPage.verifyDefaultPipelineColumnValues(defaultValue);
  },
);

Then('Create Pipeline button is enabled', () => {
  pipelinesPage.verifyCreateButtonIsEnabled();
});

Then('kebab menu button is displayed', () => {
  pipelinesPage.verifyKebabMenu();
});

Then('user will see {string} under Kebab menu', (option: string) => {
  pipelinesPage.verifyOptionInKebabMenu(option);
});

Given(
  'user is at pipeline details page with newly created pipeline {string}',
  (pipelineName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  },
);

Given('pipeline {string} is present on Pipelines page', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  navigateTo(devNavigationMenu.Pipelines);
  cy.get(pipelinesPO.pipelinesTab).click();
  pipelinesPage.search(pipelineName);
});

When('user clicks pipeline name {string} on Pipelines page', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
});

When('user clicks save on edit pipeline page', () => {
  cy.get(pipelinesPO.editPipeline.save).click();
});

Then('user is at the Pipeline Builder page', () => {
  pipelineBuilderPage.verifyTitle();
});

Then(
  'user will be redirected to pipeline details page with header {string}',
  (pipelineName: string) => {
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
);

When('user clicks Actions menu in pipeline Details page', () => {
  actionsDropdownMenu.clickActionMenu();
});

When('user clicks pipeline run of pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipelineRun(pipelineName);
});

When(
  'user clicks pipeline {string} from searched results on Pipelines page',
  (pipelineName: string) => {
    pipelinesPage.selectPipeline(pipelineName);
  },
);

When('user selects option {string} from Actions menu drop down', (action: string) => {
  actionsDropdownMenu.selectAction(action);
});

When('user clicks Delete button on Delete Pipeline modal', () => {
  modal.modalTitleShouldContain('Delete Pipeline?');
  cy.get(pipelinesPO.deletePipeline.delete).click();
  modal.shouldBeClosed();
});

When(
  'user selects {string} from the kebab menu for {string}',
  (option: string, pipelineName: string) => {
    pipelinesPage.search(pipelineName);
    pipelinesPage.selectActionForPipeline(pipelineName, option);
  },
);

When('user clicks kebab menu for the pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectKebabMenu(pipelineName);
});

Then(
  'kebab menu displays with options Start, Add Trigger, Remove Trigger, Edit Pipeline, Delete Pipeline',
  () => {
    cy.byTestActionID(pipelineActions.Start).should('be.visible');
    cy.byTestActionID(pipelineActions.AddTrigger).should('be.visible');
    cy.byTestActionID(pipelineActions.RemoveTrigger).should('be.visible');
    cy.byTestActionID(pipelineActions.EditPipeline).should('be.visible');
    cy.byTestActionID(pipelineActions.DeletePipeline).should('be.visible');
  },
);

Then('kebab menu displays with options Start, Add Trigger, Edit Pipeline, Delete Pipeline', () => {
  cy.byTestActionID(pipelineActions.Start).should('be.visible');
  cy.byTestActionID(pipelineActions.AddTrigger).should('be.visible');
  cy.byTestActionID(pipelineActions.EditPipeline).should('be.visible');
  cy.byTestActionID(pipelineActions.DeletePipeline).should('be.visible');
});

Then('kebab menu contains options Start, Add Trigger, Edit Pipeline, Delete Pipeline', () => {
  pipelinesPage.verifyKebabMenu();
  cy.get(pipelinesPO.pipelinesTable.kebabMenu).click({ force: true });
  cy.byTestActionID(pipelineActions.Start).should('be.visible');
  cy.byTestActionID(pipelineActions.AddTrigger).should('be.visible');
  cy.byTestActionID(pipelineActions.EditPipeline).should('be.visible');
  cy.byTestActionID(pipelineActions.DeletePipeline).should('be.visible');
});

Then(
  'user will be redirected to Pipeline Details page with header name {string}',
  (pipelineName: string) => {
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
);

Then('user is able to see Details, Metrics, YAML, Pipeline Runs and Parameters tabs', () => {
  pipelineDetailsPage.verifyTabs();
});

Then(
  'Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner and Tasks',
  () => {
    pipelineDetailsPage.verifyFieldsInDetailsTab();
  },
);

Then('Actions dropdown display in the top right corner of the page', () => {
  actionsDropdownMenu.verifyActionsMenu();
});

Then('Actions menu display with options Start, Add Trigger, Edit Pipeline, Delete Pipeline', () => {
  cy.byTestActionID(pipelineActions.Start).should('be.visible');
  cy.byTestActionID(pipelineActions.AddTrigger).should('be.visible');
  cy.byTestActionID(pipelineActions.EditPipeline).should('be.visible');
  cy.byTestActionID(pipelineActions.DeletePipeline).should('be.visible');
});

Then('Actions menu contains options Start, Add Trigger, Edit Pipeline, Delete Pipeline', () => {
  actionsDropdownMenu.clickActionMenu();
  cy.byTestActionID(pipelineActions.Start).should('be.visible');
  cy.byTestActionID(pipelineActions.AddTrigger).should('be.visible');
  cy.byTestActionID(pipelineActions.EditPipeline).should('be.visible');
  cy.byTestActionID(pipelineActions.DeletePipeline).should('be.visible');
});

Then('Name field will be disabled', () => {
  cy.get(pipelineBuilderPO.formView.name).should('be.disabled');
});

Then('Add Parameters, Add Resources, Task should be displayed', () => {
  cy.get(pipelineBuilderPO.formView.addResourcesLink).eq(0).should('be.enabled');
  cy.get(pipelineBuilderPO.formView.addResourcesLink).eq(1).should('be.enabled');
  cy.get(pipelineBuilderPO.formView.task).should('be.visible');
});

Then('{string} is not displayed on Pipelines page', (pipelineName: string) => {
  cy.get(pipelinesPO.search).clear().type(pipelineName);
  cy.byTestID('empty-box-body').should('be.visible');
});

Then('user will be redirected to Pipeline Run Details page', () => {
  pipelineRunDetailsPage.verifyTitle();
  pipelineRunDetailsPage.selectTab('Details');
});

Then('user is able to see pipeline run in topology side bar', () => {
  topologySidePane.verifyPipelineRuns();
});

Then('user will be redirected to Pipelines page', () => {
  detailsPage.titleShouldContain(adminNavigationMenu.pipelines);
});

When('user clicks Save button on Pipeline Builder page', () => {
  pipelineBuilderPage.clickSaveButton();
});

Then('user clicks on Add task button', () => {
  cy.get('[data-test="task-list"]').click();
});

When('user clicks on Add task in parallel', () => {
  cy.mouseHover(pipelineBuilderPO.formView.task);
  cy.get(pipelineBuilderPO.formView.plusTaskIcon).eq(2).click({ force: true });
});

Then('user clicks on Add in selected task', () => {
  cy.byTestID('task-cta').click();
});

Given('pipeline run is available for {string}', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  Cypress.env('PIPELINE_NAME', pipelineName);
  pipelineBuilderPage.enterPipelineName(pipelineName);
  cy.get('[data-test="task-list"]').click();
  cy.get(pipelineBuilderPO.formView.quickSearch).type('kn');
  cy.byTestID('task-cta').click();
  pipelineBuilderPage.clickCreateButton();
  actionsDropdownMenu.selectAction('Start');
  cy.get('[data-test="pipeline-visualization"]').should('be.visible');
  cy.get('[data-test="status-text"]', { timeout: 50000 }).should('include.text', 'Succeeded');
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
});

Then('Pipeline run details page is displayed', () => {
  pipelineRunDetailsPage.verifyTitle();
});

Then('pipeline run status displays as {string} in Pipeline run page', (pipelineStatus: string) => {
  cy.get('[data-test="status-text"]').should('include.text', pipelineStatus);
});

Then(
  'Last run status of the {string} displays as {string} in pipelines page',
  (pipelineName: string, pipelineStatus: string) => {
    navigateTo(devNavigationMenu.Pipelines);
    pipelinesPage.search(pipelineName);
    cy.get('[data-test="status-text"]').should('include.text', pipelineStatus);
  },
);
