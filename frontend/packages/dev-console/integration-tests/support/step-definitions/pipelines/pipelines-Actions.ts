import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelinesPage, pipelinesObj } from '../../pages/pipelines_page';
import { pipelineBuilderPage, pipelineBuilderObj } from '../../pages/pipelineBuilder_page';
import { pipelineDetailsPage } from '../../pages/pipelineDetails_page';
import { pipelineRunDetailsPage} from '../../pages/pipelineRunDetails_page';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';


Given('pipeline run is available for {string}', (pipelineName: string) => {
  cy.log(pipelineName);
});

When('the user enters {string} into the pipelines search bar', (pipelineName: string) => {
  pipelinesPage.search(pipelineName);
});

Then('pipelines table displayed with column names Name, Namespace, Last Run, Task Status, Last Run Status and Last Run Time', () => {
  pipelinesPage.verifyPipelineTableColumns();
});

Then('column Name display with value {string}', (pipelineName: string) => {
  pipelinesPage.verifyNameInPipelinesTable(pipelineName);
});

// Then('column Namespace display with value {string}', (projectNamespace: string) => {
//   pipelinesPage.verifyNameSpaceInPipelinesTable(projectNamespace);
// });

Then('columns Last Run, Task Run Status, Last Run Status, Last Run Time with values display {string}', (defaultValue: string) => {
  pipelinesPage.verifyDefaultPipelineColumnValues(defaultValue);
});

Then('Create Pipeline button is enabled', () => {
  pipelinesPage.verifyCreateButtonIsEnabled();
});

Then('kebab menu is displayed', () => {
  pipelinesPage.verifyKebabMenu();
});

When('click kebab menu for the pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectKebabMenu(pipelineName);
});

Then('kebab menu contains option as {string}', (option: string) => {
  pipelinesPage.verifyOptionInKebabMenu(option);
});

Given('user is at pipeline details page with newly created pipeline', () => {
  pipelinesPage.verifyPipelinesTableDisplay();
});

Given('pipeline with name {string} is present on Pipelines page', (pipelineName: string) => {
  pipelinesPage.createPipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  naviagteTo(devNavigationMenu.Pipelines);
});

Given('pipeline {string} consists of task {string} without parameters and resources', (pipelineName: string, taskName: string) => {
  pipelinesPage.createPipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName, taskName);
  naviagteTo(devNavigationMenu.Pipelines);
});

When('user clicks pipeline name {string} on Pipelines page', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
});

When('user clicks Actions menu in pipeline Details page', () => {
  pipelineDetailsPage.clickActionMenu();
});

When('user clicks pipeline run of pipeline {string}', (pipelineName: string) => {
  pipelinesPage.seelctPipelineRun(pipelineName);
});

When('click pipeline name {string} from searched results on Pipelines page', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
});

When('user selects the option {string} from Actions menu drop down', (action: string) => {
  pipelineDetailsPage.selectActionFromActionsDropdown(action);
});

When('click Delete on Delete Pipeline popup', () => {
  cy.alertTitleShouldBe('Delete Pipeline?');
  cy.get(pipelinesObj.deletePipeline.delete).click();
});

When('user selects {string} from the kebab menu for {string}', (option: string, pipelineName:string) => {
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID(option).click();
});

When('the user clicks kebab menu for the pipeline {string}', (a: string) => {
  cy.log(a)
  // TODO: implement step
});

Then('kebab menu display with  options Start, Add Trigger, Remove Trigger, Edit Pipeline, Delete Pipeline', () => {
  // TODO: implement step
});

Then('user redirects to Pipeline Details page with header name {string}', (a: string) => {
  cy.log(a)
  // TODO: implement step
});

Then('user is able to see Details, YAML, Pipeline Runs, Parameters and Resources tabs', () => {
  // TODO: implement step
});

Then('Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner and Tasks', () => {
  // TODO: implement step
});

Then('Actions dropdown display in the top right corner of the page', () => {
  // TODO: implement step
});

Then('Actions menu display with options {string}, {string}, {string}, {string}', (a: string, b: string, c: string, d: string) => {
  // TODO: implement step
  cy.log(a,b,c,d);
});

Then('Pipeline run details page is dislayed', () => {
  // TODO: implement step
});

Then('the pipelien run status displays as {string} in Pipeline run page', (a: string) => {
  cy.log(a);
  // TODO: implement step
});

Then('the Last run status of the {string} displays as {string} in pipelines page', (a: string, b: string) => {
  cy.log(a, b);
  // TODO: implement step
});

Then('Name field should be disabled', () => {
  cy.get('#form-input-name-field').should('be.disabled');
});

Then('Add Parameters, Add Resources, Task should be displayed', () => {
  cy.get(pipelineBuilderObj.add).eq(0).should('be.enabled');
  cy.get(pipelineBuilderObj.add).eq(1).should('be.enabled');
  cy.get(pipelineBuilderObj.task).should('be.visible');
});

Then('{string} is not displayed on Pipelines page', (pipelineName: string) => {
  cy.byLegacyTestID(pipelineName).should('not.be.visible');
});

Then('page redirects to Pipeline Run Details page', () => {
  pipelineRunDetailsPage.verifyTitle();
});
