import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelinesPage } from '../../pages/pipelines_page';
import { pipelineBuilderPage, pipelineBuilderObj } from '../../pages/pipelineBuilder_page';
import { pipelineDetailsPage } from '../../pages/pipelineDetails_page';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global'

When('user clicks Create Pipeline button on Pipelines page', () => {
  pipelinesPage.createPipeline();
});

Then('user redirects to Pipeline Builder page', () => {
  pipelineBuilderPage.verifyTitle();
});

Then('Name displayed wtih default value new-pipeline', () => {
  pipelineBuilderPage.verifyDefaultPipelineName();
});

Then('Tasks, Paramters and Resources sections are displayed', () => {
  pipelineBuilderPage.verifySection();
});

Then('Edit Yaml link is enabled', () => {
  cy.byButtonText('Edit YAML').should('be.enabled');
});

Then('Create button is in disabled state', () => {
  cy.byLegacyTestID('submit-button').should('be.disabled');
});

Given('user is at Pipeline Builder page', () => {
  naviagteTo(devNavigationMenu.Pipelines);
  pipelinesPage.createPipeline();
  pipelineBuilderPage.verifyTitle();
});

When('user types pipeline name as {string}', (pipelineName: string) => {
  pipelineBuilderPage.enterPipelineName(pipelineName);
});

When('select {string} from Task drop down', (taskName: string) => {
  pipelineBuilderPage.selectTask(taskName);
});

When('user adds another task {string} in parallel', (taskName: string) => {
  // add mouser hover on task to select + button
  pipelineBuilderPage.seelctParallelTask(taskName);
  pipelineBuilderPage.addResource('git resource');
  pipelineBuilderPage.clickOnTask(taskName);
  cy.get(pipelineBuilderObj.sidePane.inputResource).click();
  cy.get(`[data-test-dropdown-menu="git resource"]`).click();
  pipelineBuilderPage.create();
});

When('clicks Create button on Pipeline Builder page', () => {
  pipelineBuilderPage.create();
});

Then('user redirects to Pipeline Details page with header name {string}', (pipelineName: string) => {
  pipelineDetailsPage.verifyTitle(pipelineName);
});

Then('tasks displayed parallel in pipelines section', () => {
  
});

When('user adds another task {string} in series', (a: string) => {
  cy.log(a);
});

Then('tasks displayed serially in pipelines section', () => {
  // TODO: implement step
});

When('add {string} resource with name {string} to the {string}', (resourceType: string, resourceName: string, taskName: string) => {
  cy.log(resourceType, resourceName, taskName);
});

When('user clicks {string} button on Pipeline Builder page', (buttonName: string) => {
  cy.log(buttonName);
});

When('add the parameter details like Name, Description and Default Value', () => {

});

Then('task details present in pipeline details section', () => {

});

Then('parameter details displayed in parameters section', () => {

});
