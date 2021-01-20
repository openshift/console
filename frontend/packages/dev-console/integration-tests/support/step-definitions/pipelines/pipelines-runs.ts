import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelinesPage, startPipelineInPipelinesPage } from '../../pages/pipelines/pipelines-page';
import { pipelineBuilderPage } from '../../pages/pipelines/pipelineBuilder-page';
import {
  pipelineRunDetailsPage,
  pipelineRunsPage,
} from '../../pages/pipelines/pipelineRun-details-page';
import { navigateTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';
import { pipelineDetailsPage } from '../../pages/pipelines/pipelineDetails-page';
import { addPage } from '../../pages/add-flow/add-page';
import { addOptions } from '../../constants/add';
import { topologyPage } from '../../pages/topology/topology-page';
import { topologySidePane } from '../../pages/topology/topology-side-pane-page';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { pipelineRunDetailsPO, pipelinesPO } from '../../pageObjects/pipelines-po';
import { gitPage } from '../../pages/add-flow/git-page';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';

const store: Record<string, string> = {};

Given(
  'pipeline {string} consists of task {string} with one git resource',
  (pipelineName: string, taskName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithGitResources(pipelineName, taskName);
    store.pipelineWithOneGitResource = pipelineName;
  },
);

When('user fills the details in Start Pipeline popup', () => {
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/nodejs-ex.git');
  startPipelineInPipelinesPage.clickStart();
});

Then('page will be redirected to pipeline Run details page', () => {
  pipelineRunDetailsPage.verifyTitle();
});

Then('user is able to see the pipelineRuns with status as {string}', (PipelineStatus: string) => {
  pipelineRunDetailsPage.fieldDetails('Status', PipelineStatus);
});

Then('pipeline run details for {string} display in Pipelines page', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get('[title="PipelineRun"]').should('be.visible');
});

Given('user started the pipeline {string} in pipelines page', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID('Start').click();
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
});

Given('pipeline run is displayed for {string} without resource', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  store.pipelineWithOutResource = pipelineName;
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID('Start').click();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get('[title="PipelineRun"]').should('be.visible');
});

Given('pipeline run is displayed for {string} with resource', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
  store.pipelineWithResource = pipelineName;
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID('Start').click();
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/nodejs-ex.git');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get('[title="PipelineRun"]').should('be.visible');
});

When('user clicks Last Run value of {string}', (pipelineName: string) => {
  pipelinesPage.selectPipelineRun(pipelineName);
});

When('user navigates to pipelineRuns page', () => {
  cy.byLegacyTestID('breadcrumb-link-0').click();
});

When('user selects the kebab menu in pipeline Runs page', () => {
  cy.get('tbody tr')
    .eq(0)
    .find('td:nth-child(6) button')
    .click();
});

Then('user is able to see kebab menu options Rerun, Delete Pipeline Run', () => {
  cy.byTestActionID('Rerun').should('be.visible');
  cy.byTestActionID('Delete Pipeline Run').should('be.visible');
});

Then('user is able to see Details, YAML and Logs tabs', () => {
  pipelineRunDetailsPage.verifyTabs();
});

Then(
  'Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Status, Pipeline and Triggered by',
  () => {
    pipelineRunDetailsPage.verifyFields();
  },
);

Then('Actions dropdown display on the top right corner of the page', () => {
  pipelineRunDetailsPage.verifyActionsDropdown();
});

When('user selects the Pipeline Run for {string}', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectPipelineRun(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelineRunsPage.verifyTitle();
});

When('user selects Rerun option from kebab menu of {string}', (pipelineName: string) => {
  pipelineRunsPage.selectKebabMenu(pipelineName);
  cy.byTestActionID('Rerun').click();
});

Given('user is at the Pipeline Run Details page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(store.pipelineWithOutResource);
  pipelinesPage.selectPipelineRun(store.pipelineWithOutResource);
  pipelineRunDetailsPage.verifyTitle();
});

Given('5 pipeline runs are completed with the git workload', () => {
  // TODO: implement step
});

When('user selects {string} option from Actions menu', (option: string) => {
  pipelineRunDetailsPage.selectFromActionsDropdown(option);
});

When('user selects {string} option from pipeline Details Actions menu', (option: string) => {
  pipelineDetailsPage.selectActionFromActionsDropdown(option);
});

When('user selects Rerun option from the Actions menu', () => {
  pipelineRunDetailsPage.selectFromActionsDropdown('Rerun');
});

Then('status displays as {string} in pipeline run details page', (PipelineStatus: string) => {
  pipelineRunDetailsPage.fieldDetails('Status', PipelineStatus);
});

Then('user will be redirected to Pipeline Run Details page', () => {
  pipelineRunDetailsPage.verifyTitle();
});

Then('page will be redirected to pipeline runs page', () => {
  pipelineRunsPage.verifyTitle();
});

Then('side bar is displayed with the pipelines section', () => {
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifySection('Pipeline Runs');
});

Then('3 pipeline runs are displayed under pipelines section of topology page', () => {
  cy.get('li.odc-pipeline-run-item').should('not.be.greaterThan', 3);
});

Then('View all link is displayed', () => {
  cy.get('a.sidebar__section-view-all').should('contain.text', 'View all');
});

Given(
  'pipeline run is available with cancelled tasks for pipeline {string}',
  (pipelineName: string) => {
    // TODO: implement step
    cy.log(pipelineName);
  },
);

Given(
  'pipeline run is available with failed tasks for pipeline {string}',
  (pipelineName: string) => {
    // TODO: implement step
    cy.log(pipelineName);
  },
);

Given('user is at the Pipeline Details page', () => {
  // TODO: implement step
});

Given('pipeline {string} is executed for 3 times', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  pipelineDetailsPage.clickActionMenu();
  cy.byTestActionID('Start').click();
  pipelineRunDetailsPage.verifyTitle();
  pipelineRunDetailsPage.waitForTaskRunToComplete();
  cy.selectActionsMenuOption('Rerun');
  pipelineRunDetailsPage.waitForTaskRunToComplete();
  cy.selectActionsMenuOption('Rerun');
  pipelineRunDetailsPage.verifyTitle();
  cy.get(pipelineRunDetailsPO.pipelineRunStatus).contains('Succeeded', {
    timeout: 50000,
  });
});

Given('user is at the Pipeline Runs page', () => {
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelineRunsPage.verifyTitle();
});

When(
  'user filters the pipeline runs of pipeline {string} based on the {string}',
  (pipelineName: string, status: string) => {
    navigateTo(devNavigationMenu.Pipelines);
    pipelinesPage.selectPipelineRun(pipelineName);
    cy.byLegacyTestID('breadcrumb-link-0').click();
    pipelineRunsPage.filterByStatus(status);
  },
);

Then('user is able to see the pipelineRuns with {string}', (status: string) => {
  pipelineRunsPage.verifyPipelineRunsTableDisplay();
  pipelineRunsPage.verifyStatusInPipelineRunsTable(status);
});

Then(
  'Last Run status of the {string} displays as {string}',
  (pipelineName: string, lastRunStatus: string) => {
    pipelinesPage.search(pipelineName);
    pipelinesPage.verifyLastRunStatusInPipelinesTable(lastRunStatus);
  },
);

When('user navigates to Pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

Given('one pipeline run is completed with the workload', () => {
  // TODO: implement step
});

Given('pipeline {string} is created from git page', (name: string) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.Git);
  detailsPage.titleShouldContain('Import from Git');
  gitPage.enterGitUrl('https://github.com/sclorg/nodejs-ex.git');
  gitPage.enterComponentName(name);
  gitPage.selectAddPipeline();
  gitPage.clickCreate();
  topologyPage.verifyTopologyPage();
});

Given('pipeline run is displayed for {string} in pipelines page', (name: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(name);
  pipelinesPage.selectKebabMenu(name);
  cy.byTestActionID('Start').click();
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/dancer-ex.git');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(name);
  cy.get('[title="PipelineRun"]').should('be.visible');
});

Then(
  'Last Run status of the {string} displays as {string} in topology page',
  (name: string, status: string) => {
    topologyPage.search(name);
    topologyPage.clickOnNode(name);
    topologySidePane.verify();
    topologyPage.verifyPipelineRunStatus(status);
  },
);

Given('pi[peline run is available with cancelled tasks', () => {
  // TODO: implement step
});

Given('pi[peline run is available with failed tasks', () => {
  // TODO: implement step
});

When('user clicks Actions menu on the top right corner of the page', () => {
  pipelineDetailsPage.clickActionMenu();
});

When('user clicks Last Run value of the pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipelineRun(pipelineName);
});

Then('Start Pipeline modal displays with Git Resources, Advanced Options sections', () => {
  startPipelineInPipelinesPage.verifySections();
});

Then('start button is disabled', () => {
  cy.get(pipelinesPO.startPipeline.start).should('be.disabled');
  startPipelineInPipelinesPage.clickCancel();
});

Then(
  'Actions menu display with the options {string}, {string}',
  (option1: string, option2: string) => {
    cy.byTestActionID(option1).should('be.visible');
    cy.byTestActionID(option2).should('be.visible');
  },
);

Then('Pipeline Resources field will be displayed', () => {
  // TODO: implement step
});

When('user navigates to pipelineRun logs tab', () => {
  pipelineRunDetailsPage.selectTab('Logs');
});

When('user clicks on Download button', () => {
  pipelineRunDetailsPage.clickOnDownloadLink();
});

When('user clicks on Expand button', () => {
  pipelineRunDetailsPage.clickOnExpandLink();
});

Then('user is able to see expanded logs page', () => {
  cy.byButtonText('Collapse').should('be.visible');
});

Then('user is able to see the downloaded file', () => {
  // Manual step
});

When('user clicks Start LastRun from topology side bar', () => {
  topologySidePane.clickStartLastRun();
});

Then('logs contains tasks with details of execution', () => {
  // Manual step
});
