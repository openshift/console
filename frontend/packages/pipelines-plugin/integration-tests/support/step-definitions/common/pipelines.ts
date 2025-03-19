import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  pageTitle,
} from '@console/dev-console/integration-tests/support/constants';
import { app, navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { pipelineActions } from '../../constants';
import { pipelinesPO } from '../../page-objects';
import {
  pipelineRunDetailsPage,
  pipelineBuilderPage,
  pipelinesPage,
  startPipelineInPipelinesPage,
} from '../../pages';

When(
  'user selects {string} option from kebab menu for pipeline {string}',
  (option: string, pipelineName: string) => {
    pipelinesPage.search(pipelineName);
    pipelinesPage.selectActionForPipeline(pipelineName, option);
  },
);

Given('pipeline run is displayed for {string} with resource', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  cy.get('#form-radiobutton-editorType-form-field').click();
  pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.search(pipelineName);
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/nodejs-ex.git');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  cy.get(pipelinesPO.pipelinesTab).click();
  pipelinesPage.search(pipelineName);
  cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
});

Given(
  'pipeline run is displayed for {string} with workspace {string} of type {string}',
  (pipelineName: string, workspaceName: string, workspaceType: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithWorkspaces(pipelineName, workspaceName);
    cy.byLegacyTestID('breadcrumb-link-0').click();
    pipelinesPage.search(pipelineName);
    pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
    modal.modalTitleShouldContain('Start Pipeline');
    startPipelineInPipelinesPage.selectWorkSpace(workspaceType);
    startPipelineInPipelinesPage.clickStart();
    pipelineRunDetailsPage.verifyTitle();
    navigateTo(devNavigationMenu.Pipelines);
    pipelinesPage.search(pipelineName);
    cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
  },
);

Given(
  'pipeline {string} is created with {string} workspace',
  (pipelineName: string, workspaceName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithWorkspaces(pipelineName, 'git-clone', workspaceName);
    cy.byLegacyTestID('breadcrumb-link-0').click();
    pipelinesPage.search(pipelineName);
  },
);

Given(
  'pipeline {string} with at least one workspace {string} and no previous Pipeline Runs',
  (pipelineName: string, workspaceName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithWorkspaces(pipelineName, 'git-clone', workspaceName);
    cy.byLegacyTestID('breadcrumb-link-0').click();
    pipelinesPage.search(pipelineName);
  },
);

When('user adds another task {string} in parallel', (taskName: string) => {
  pipelineBuilderPage.selectParallelTask(taskName);
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  cy.get(pipelinesPO.pipelinesTab).click();
});

Given('user is at pipelines page in admin view', () => {
  cy.get('[data-test="nav"][data-quickstart-id="qs-nav-pipelines"]')
    .should('exist')
    .click({ force: true });
  cy.get(pipelinesPO.pipelinesTab).click();
});

Given('user has installed OpenShift Pipelines operator using cli', () => {
  cy.exec(`oc apply -f testData/installPipelinesOperator.yaml`);
  cy.exec(
    `oc patch OperatorHub cluster --type json -p '[{"op": "add", "path": "/spec/disableAllDefaultSources", "value": true}]'`,
  );
});

Then('user redirects to Pipelines page', () => {
  detailsPage.titleShouldContain(pageTitle.Pipelines);
});

Then('user redirects to Pipeline Builder page', () => {
  pipelineBuilderPage.verifyTitle();
  app.waitForLoad();
});
