import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  pageTitle,
} from '@console/dev-console/integration-tests/support/constants';
import {
  topologyPage,
  topologySidePane,
  navigateTo,
  app,
} from '@console/dev-console/integration-tests/support/pages';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { pipelineActions, pipelineBuilderText } from '../../constants';
import { pipelineRunDetailsPO, pipelineRunsPO, pipelinesPO } from '../../page-objects/pipelines-po';
import {
  pipelinesPage,
  startPipelineInPipelinesPage,
  pipelineBuilderPage,
  pipelineRunDetailsPage,
  pipelineDetailsPage,
  pipelineRunsPage,
} from '../../pages';
import { actionsDropdownMenu } from '../../pages/functions/common';

Given(
  'pipeline {string} consists of task {string} with one git resource',
  (pipelineName: string, taskName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithGitResources(pipelineName, taskName);
  },
);

When('user fills the details in Start Pipeline popup', () => {
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/nodejs-ex.git');
  startPipelineInPipelinesPage.clickStart();
});

When('user enters git url as {string} in start pipeline modal', (gitUrl: string) => {
  modal.shouldBeOpened();
  app.waitForLoad();
  startPipelineInPipelinesPage.verifyGitRepoUrlAndEnterGitUrl(gitUrl);
});

When('user enters revision as {string} in start pipeline modal', (revision: string) => {
  startPipelineInPipelinesPage.enterRevision(revision);
});

When('user clicks Start button in start pipeline modal', () => {
  modal.submit();
});

Then('page will be redirected to pipeline Run details page', () => {
  pipelineRunDetailsPage.verifyTitle();
});

Then('user is able to see the pipelineRuns with status as {string}', (PipelineStatus: string) => {
  cy.contains('Running').should('not.exist');
  app.waitForLoad();
  pipelineRunDetailsPage.fieldDetails('Status', PipelineStatus);
});

Then(
  'user is able to see the filtered results with pipelineRuns status {string}',
  (PipelineStatus: string) => {
    cy.get(pipelineRunsPO.pipelineRunsTable.status).each(($el) => {
      expect($el.text()).toContain(PipelineStatus);
    });
  },
);

Then('user is able to see the pipelineRuns with status as Running', () => {
  pipelineRunDetailsPage.fieldDetails('Status', 'Running');
});

Then('pipeline run details for {string} display in Pipelines page', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get('[title="PipelineRun"]').should('be.visible');
});

Given('user started the pipeline {string} in pipelines page', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
});

Given('pipeline run is displayed for {string} without resource', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get('[title="PipelineRun"]').should('be.visible');
});

Given('pipeline run is displayed for {string} with resource', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/nodejs-ex.git');
  modal.submit();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
});

When('user clicks Last Run value of {string}', (pipelineName: string) => {
  pipelinesPage.selectPipelineRun(pipelineName);
});

When('user navigates to pipelineRuns page', () => {
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelineRunsPage.verifyTitle();
});

When(
  'user selects the kebab menu in pipeline Runs page for pipeline {string}',
  (pipelineName: string) => {
    pipelineRunsPage.selectKebabMenu(pipelineName);
  },
);

Then('user is able to see kebab menu options Rerun, Delete Pipeline Run', () => {
  cy.byTestActionID(pipelineActions.Rerun).should('be.visible');
  cy.byTestActionID('Delete PipelineRun').should('be.visible');
});

Then('user is able to see Details, YAML, TaskRuns, Logs and Events tabs', () => {
  pipelineRunDetailsPage.verifyTabs();
});

Then(
  'Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Status, Pipeline and Triggered by',
  () => {
    pipelineRunDetailsPage.verifyFields();
  },
);

Then('Actions dropdown display on the top right corner of the page', () => {
  actionsDropdownMenu.verifyActionsMenu();
});

When('user selects the Pipeline Run for {string}', (pipelineName: string) => {
  pipelinesPage.selectPipelineRun(pipelineName);
});

When('user selects Rerun option from kebab menu of {string}', (pipelineName: string) => {
  pipelineRunsPage.selectKebabMenu(pipelineName);
  cy.byTestActionID(pipelineActions.Rerun).click();
});

Given('user is at the Pipeline Run Details page of pipeline {string}', (pipelineName: string) => {
  pipelinesPage.search(pipelineName);
  pipelinesPage.selectPipelineRun(pipelineName);
  pipelineRunDetailsPage.verifyTitle();
});

When('user navigates to Pipeline runs page', () => {
  cy.byLegacyTestID('breadcrumb-link-0').click();
});

When('user selects {string} option from Actions menu', (option: string) => {
  pipelineRunDetailsPage.selectFromActionsDropdown(option);
});

When('user selects {string} option from pipeline Details Actions menu', (option: string) => {
  actionsDropdownMenu.selectAction(option);
});

When('user selects Rerun option from the Actions menu', () => {
  pipelineRunDetailsPage.selectFromActionsDropdown(pipelineActions.Rerun);
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
  topologySidePane.verifySection(pageTitle.PipelineRuns);
});

Then('3 pipeline runs are displayed under pipelines section of topology page', () => {
  cy.get('li.odc-pipeline-run-item').should('not.be.greaterThan', 3);
});

Then('View all link is displayed', () => {
  cy.get('a.sidebar__section-view-all').should('contain.text', 'View all');
});

Given('pipeline {string} is executed for 3 times', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  actionsDropdownMenu.clickActionMenu();
  cy.byTestActionID(pipelineActions.Start).click();
  pipelineRunDetailsPage.verifyTitle();
  pipelineRunDetailsPage.verifyPipelineRunStatus('Succeeded');
  cy.waitFor('[data-test-id="actions-menu-button"]');
  cy.selectActionsMenuOption(pipelineActions.Rerun);
  pipelineRunDetailsPage.verifyPipelineRunStatus('Succeeded');
  cy.waitFor('[data-test-id="actions-menu-button"]');
  cy.selectActionsMenuOption(pipelineActions.Rerun);
  pipelineRunDetailsPage.verifyTitle();
  pipelineRunDetailsPage.verifyPipelineRunStatus('Succeeded');
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
    cy.get('[aria-label="close"]').should('be.visible');
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

Given('pipeline run is displayed for {string} in pipelines page', (name: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(name);
  pipelinesPage.selectActionForPipeline(name, pipelineActions.Start);
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/dancer-ex.git');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(name);
  cy.get('[title="PipelineRun"]').should('be.visible');
});

When('user starts the pipeline from start pipeline modal', () => {
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
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

When('user clicks Actions menu on the top right corner of the page', () => {
  actionsDropdownMenu.clickActionMenu();
});

When('user clicks Last Run value of the pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipelineRun(pipelineName);
});

Then('Start Pipeline modal displays with Git Resources, Advanced Options sections', () => {
  startPipelineInPipelinesPage.verifySections();
});

Then('start button is disabled', () => {
  cy.get(pipelinesPO.startPipeline.start).should('be.disabled');
  modal.cancel();
});

Then(
  'Actions menu display with the options {string}, {string}',
  (option1: string, option2: string) => {
    cy.byTestActionID(option1).should('be.visible');
    cy.byTestActionID(option2).should('be.visible');
  },
);

Then('user is able to see pipeline run in topology side bar', () => {
  topologySidePane.verifyPipelineRuns();
});

When('user selects Start LastRun from topology side bar', () => {
  topologySidePane.clickStartLastRun();
});

Given('pipeline {string} is present on Pipeline Details page', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectPipeline(pipelineName);
  pipelineDetailsPage.verifyTitle(pipelineName);
});

Then('Pipeline Resources field will be displayed', () => {
  cy.get('.odc-dynamic-resource-link-list').should('be.visible');
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

When('user clicks Start LastRun from topology side bar', () => {
  topologySidePane.clickStartLastRun();
});

When('user navigates to Workspaces section', () => {
  cy.get(pipelinesPO.startPipeline.sectionTitle)
    .contains('Workspaces')
    .scrollIntoView()
    .should('be.visible');
});

When(
  'user clicks on {string} workspace dropdown with Empty Directory selected by default',
  (workspaceName: string) => {
    cy.get('.modal-content')
      .contains(workspaceName)
      .should('be.visible');
    cy.get(pipelinesPO.startPipeline.sharedWorkspace)
      .find('span')
      .should('contain.text', 'Empty Directory');
    cy.get(pipelinesPO.startPipeline.emptyDirectoryInfo)
      .find('h4')
      .should('contain.text', pipelineBuilderText.formView.startPipeline.EmptyDirectoryInfoMessage);
    cy.get(pipelinesPO.startPipeline.sharedWorkspace).click();
  },
);

When('user selects {string} option from workspace dropdown', (workspaceType: string) => {
  cy.get(pipelinesPO.startPipeline.sectionTitle)
    .contains('Workspaces')
    .scrollIntoView()
    .should('be.visible');
  cy.selectByDropDownText(pipelinesPO.startPipeline.sharedWorkspace, workspaceType);
});

When('user clicks Show VolumeClaimTemplate options', () => {
  cy.get('button')
    .contains('Show VolumeClaimTemplate options')
    .click();
});

When('user selects StorageClass as {string}', (storageClassName: string) => {
  cy.selectByAutoCompleteDropDownText('#storageclass-dropdown', storageClassName);
});

Then(
  'user will see PVC Workspace {string} mentioned in the VolumeClaimTemplate Resources section of Pipeline Run Details page',
  (workspace: string) => {
    cy.get(pipelineRunDetailsPO.details.workspacesResources.volumeClaimTemplateResources).should(
      'be.visible',
    );
    cy.log(`${workspace} is visible`);
  },
);

Then('user will see VolumeClaimTemplate Workspace in Pipeline Run Details page', () => {
  cy.get(pipelineRunDetailsPO.details.workspacesResources.volumeClaimTemplateResources).should(
    'be.visible',
  );
});

When('user clicks on Start', () => {
  modal.submit();
});

Then(
  'user sees option Empty Directory, Config Map, Secret, PersistentVolumeClaim, VolumeClaimTemplate',
  () => {
    const options = [
      'Empty Directory',
      'Config Map',
      'Secret',
      'PersistentVolumeClaim',
      'VolumeClaimTemplate',
    ];
    cy.byLegacyTestID('dropdown-menu').each(($el) => {
      expect(options).toContain($el.text());
    });
    modal.cancel();
    modal.shouldBeClosed();
  },
);
