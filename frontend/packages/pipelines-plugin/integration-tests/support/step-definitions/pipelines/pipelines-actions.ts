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

Given('pipeline run is available for {string}', (pipelineName: string) => {
  // TODO: implement step
  cy.log(pipelineName);
});

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

When('user searches pipeline {string} in pipelines page', (pipelineName: string) => {
  pipelinesPage.search(pipelineName);
});

Then(
  'pipelines table displayed with column names Name, Last Run, Task Status, Last Run Status and Last Run Time',
  () => {
    pipelinesPage.verifyPipelineTableColumns();
  },
);

Then('column Name display with value {string}', (pipelineName: string) => {
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

Then(
  'user will be redirected to Pipeline Details page with header name {string}',
  (pipelineName: string) => {
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
);

Then(
  'user is able to see Details, Metrics, YAML, Pipeline Runs, Parameters and Resources tabs',
  () => {
    pipelineDetailsPage.verifyTabs();
  },
);

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

Then('Pipeline run details page is displayed', () => {
  // TODO: implement step
});

Then('pipeline run status displays as {string} in Pipeline run page', (status: string) => {
  cy.log(status);
});

Then(
  'Last run status of the {string} displays as {string} in pipelines page',
  (a: string, b: string) => {
    cy.log(a, b);
  },
);

Then('Name field will be disabled', () => {
  cy.get(pipelineBuilderPO.formView.name).should('be.disabled');
});

Then('Add Parameters, Add Resources, Task should be displayed', () => {
  cy.get(pipelineBuilderPO.add)
    .eq(0)
    .should('be.enabled');
  cy.get(pipelineBuilderPO.add)
    .eq(1)
    .should('be.enabled');
  cy.get(pipelineBuilderPO.formView.task).should('be.visible');
});

Then('{string} is not displayed on Pipelines page', (pipelineName: string) => {
  cy.get(pipelinesPO.search)
    .clear()
    .type(pipelineName);
  cy.byTestID('empty-message').should('be.visible');
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
