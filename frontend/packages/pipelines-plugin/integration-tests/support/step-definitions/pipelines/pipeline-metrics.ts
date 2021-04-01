import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelineDetailsText } from '../../constants/static-text/pipeline-details-text';
import { pipelineDetailsPO } from '../../page-objects/pipelines-po';
import { pipelineDetailsPage } from '../../pages/pipelines/pipelineDetails-page';

Then('user can see empty page with message {string}', (message: string) => {
  cy.get(pipelineDetailsPO.metrics.emptyMessage).should('contain.text', message);
});

When('user clicks on Metrics tab', () => {
  pipelineDetailsPage.selectTab('Metrics');
});

Then('user can see Time Range with a default value of {string}', (defaultTimeRange: string) => {
  cy.get('.form-group button')
    .first()
    .should('contain.text', defaultTimeRange);
});

Then(
  'user can see and Refresh Interval with a default value of {string}',
  (defaultRefreshInterval: string) => {
    cy.get('.form-group button')
      .eq(1)
      .should('contain.text', defaultRefreshInterval);
  },
);

Then(
  'user can see Pipeline success ratio, Number of Pipeline Runs, Pipeline Run duration, Task Run duration graphs',
  () => {
    cy.get(pipelineDetailsPO.metrics.graphTitle)
      .eq(0)
      .should('contain.text', pipelineDetailsText.metrics.graphs.pipelineSuccessRatio);
    cy.get(pipelineDetailsPO.metrics.graphTitle)
      .eq(1)
      .should('contain.text', pipelineDetailsText.metrics.graphs.numberOfPipelineRuns);
    cy.get(pipelineDetailsPO.metrics.graphTitle)
      .eq(2)
      .should('contain.text', pipelineDetailsText.metrics.graphs.pipelineRunDuration);
    cy.get(pipelineDetailsPO.metrics.graphTitle)
      .eq(3)
      .should('contain.text', pipelineDetailsText.metrics.graphs.taskRunDuration);
  },
);
