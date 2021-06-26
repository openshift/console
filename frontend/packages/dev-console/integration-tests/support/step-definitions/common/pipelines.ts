import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  pipelinesPage,
  startPipelineInPipelinesPage,
  pipelineBuilderPage,
  pipelineRunDetailsPage,
  app,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  pageTitle,
} from '@console/dev-console/integration-tests/support/constants';
import {
  pipelineBuilderPO,
  pipelinesPO,
} from '@console/dev-console/integration-tests/support/pageObjects';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';

Given('pipeline run is displayed for {string} with resource', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID('Start').click();
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/nodejs-ex.git');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
});

When('user adds another task {string} in parallel', (taskName: string) => {
  pipelineBuilderPage.selectParallelTask(taskName);
  pipelineBuilderPage.addResource('git resource');
  pipelineBuilderPage.clickOnTask(taskName);
  cy.get(pipelineBuilderPO.sidePane.inputResource).click();
  cy.byTestDropDownMenu('git resource').click();
  pipelineBuilderPage.clickCreateButton();
});

Given('pipeline run is displayed for {string} with resource', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID('Start').click();
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/nodejs-ex.git');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
});

When('user adds another task {string} in parallel', (taskName: string) => {
  pipelineBuilderPage.selectParallelTask(taskName);
  pipelineBuilderPage.addResource('git resource');
  pipelineBuilderPage.clickOnTask(taskName);
  cy.get(pipelineBuilderPO.sidePane.inputResource).click();
  cy.byTestDropDownMenu('git resource').click();
  pipelineBuilderPage.clickCreateButton();
});

Then('user redirects to Pipelines page', () => {
  detailsPage.titleShouldContain(pageTitle.Pipelines);
});

Then('user redirects to Pipeline Builder page', () => {
  pipelineBuilderPage.verifyTitle();
  app.waitForLoad();
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

When('user clicks on pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
});

When(
  'user selects {string} option from kebab menu for pipeline {string}',
  (option: string, pipelineName: string) => {
    pipelinesPage.selectKebabMenu(pipelineName);
    cy.byTestActionID(option).click();
  },
);
