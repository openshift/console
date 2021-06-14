import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { app } from '@console/dev-console/integration-tests/support/pages/app';
import { pipelineDetailsPO } from '../../page-objects/pipelines-po';
import { pipelineRunDetailsPage } from '../../pages/pipelines/pipelineRun-details-page';
import { pipelinesPage } from '../../pages/pipelines/pipelines-page';

When('user clicks on pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
});

When('user navigates to Pipeline Runs tab', () => {
  cy.get(pipelineDetailsPO.pipelineRunsTab).click();
});

When('user clicks on pipeline run for pipeline {string}', (pipelineName: string) => {
  cy.get(`[data-test-id^="${pipelineName}-"]`).click();
});

When('user clicks on Events tab in pipeline Runs page', () => {
  pipelineRunDetailsPage.selectTab('Events');
});

Then(
  'user can see events streaming for pipeline runs and all the associated task runs and pods',
  () => {
    app.waitForLoad();
    cy.get('[role="rowgroup"]').should('be.visible');
  },
);
