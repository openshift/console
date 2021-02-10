import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelinesPage } from '../../pages/pipelines/pipelines-page';
import { pipelineBuilderPage } from '../../pages/pipelines/pipelineBuilder-page';
import { pipelineDetailsPage } from '../../pages/pipelines/pipelineDetails-page';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages/app';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { pipelineBuilderPO } from '../../page-objects/pipelines-po';

When('user clicks Create Pipeline button on Pipelines page', () => {
  pipelinesPage.clickOnCreatePipeline();
});

Then('user will be redirected to Pipeline Builder page', () => {
  pipelineBuilderPage.verifyTitle();
});

Then(
  'user is able to see pipeline name with default value {string}',
  (pipelineDefaultValue: string) => {
    pipelineBuilderPage.verifyDefaultPipelineName(pipelineDefaultValue);
  },
);

Then('Tasks, Parameters and Resources sections are displayed', () => {
  pipelineBuilderPage.verifySection();
});

Then('Edit Yaml link is enabled', () => {
  cy.byButtonText('Edit YAML').should('be.enabled');
});

Then('Yaml view configuration is displayed', () => {
  cy.get(pipelineBuilderPO.configureVia.yamlView).should('be.visible');
});

Then('Create button is in disabled state', () => {
  cy.byLegacyTestID('submit-button').should('be.disabled');
});

Given('user is at Pipeline Builder page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.verifyTitle();
});

When('user enters pipeline name as {string}', (pipelineName: string) => {
  pipelineBuilderPage.enterPipelineName(pipelineName);
});

When('user selects {string} from Task drop down', (taskName: string) => {
  pipelineBuilderPage.selectTask(taskName);
});

When('user adds another task {string} in parallel', (taskName: string) => {
  pipelineBuilderPage.selectParallelTask(taskName);
  pipelineBuilderPage.addResource('git resource');
  pipelineBuilderPage.clickOnTask(taskName);
  cy.get(pipelineBuilderPO.formView.sidePane.inputResource).click();
  cy.byTestDropDownMenu('git resource').click();
  pipelineBuilderPage.clickCreateButton();
});

When('user clicks Create button on Pipeline Builder page', () => {
  pipelineBuilderPage.clickCreateButton();
});

Then(
  'user will be redirected to Pipeline Details page with header name {string}',
  (pipelineName: string) => {
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
);

When('user adds another task {string} in series', (taskName: string) => {
  pipelineBuilderPage.selectSeriesTask(taskName);
  pipelineBuilderPage.addResource('git resource');
  pipelineBuilderPage.clickOnTask(taskName);
  cy.get(pipelineBuilderPO.formView.sidePane.inputResource).click();
  cy.byTestDropDownMenu('git resource').click();
  pipelineBuilderPage.clickCreateButton();
});

When(
  'user adds {string} resource with name {string} to the {string}',
  (resourceType: string, resourceName: string) => {
    pipelineBuilderPage.addResource(resourceName, resourceType);
  },
);

When('user adds the parameter details like Name, Description and Default Value', () => {
  pipelineBuilderPage.addParameters('param-1', 'description', 'openshift/hello-openshift');
});

When('user adds the image name to the pipeline task {string}', (pipelineTaskName: string) => {
  pipelineBuilderPage.clickOnTask(pipelineTaskName);
  cy.get(pipelineBuilderPO.formView.sidePane.imageName).type('openshift/hello-openshift');
  //  Close button is missing in side pane, Defect: ODC-5519 raised
  // sidePane.close();
});

When('user selects YAML view', () => {
  pipelineBuilderPage.clickYaml();
});

When('user clicks Create button on Pipeline Yaml page', () => {
  pipelineBuilderPage.clickCreateButton();
});

When('user clicks on Add parameter link', () => {
  cy.byButtonText('Add parameter').click();
});
