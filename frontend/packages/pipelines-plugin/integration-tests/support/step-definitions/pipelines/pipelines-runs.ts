import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  pageTitle,
  addOptions,
} from '@console/dev-console/integration-tests/support/constants';
import { switchPerspective } from '@console/dev-console/integration-tests/support/constants/global';
import {
  topologyPage,
  topologySidePane,
  navigateTo,
  app,
  addPage,
  gitPage,
  devFilePage,
} from '@console/dev-console/integration-tests/support/pages';
import { perspective } from '@console/dev-console/integration-tests/support/pages/app';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { pipelineActions, pipelineBuilderText } from '../../constants';
import {
  pipelineRunDetailsPO,
  pipelineRunsPO,
  pipelinesPO,
  pipelineDetailsPO,
  triggerTemplateDetailsPO,
} from '../../page-objects/pipelines-po';
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
  cy.get(pipelineRunsPO.pipelineRunsTable.status).should('contain.text', 'Running');
});

Then('user is able to see the pipelineRuns with status as Succeeded', () => {
  cy.get(pipelineRunsPO.pipelineRunsTable.status).should('contain.text', 'Succeeded');
});

Then(
  'Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner and Pipelines',
  () => {
    pipelineRunDetailsPage.verifyFields();
  },
);

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

Then('user is able to see Details, YAML, TaskRuns, Parameters, Logs and Events tabs', () => {
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

let numOfPipelineRunsBeforeDeletion: number;
let numOfPipelineRunsAfterDeletion: number;

When(
  'user selects Delete PipelineRun option from kebab menu of {string}',
  (pipelineName: string) => {
    cy.get(pipelineRunsPO.pipelineRunsTable.table)
      .find('tr')
      .then(($ele) => {
        numOfPipelineRunsBeforeDeletion = $ele.length;
      });
    pipelineRunsPage.selectKebabMenu(pipelineName);
    cy.byTestActionID(pipelineActions.DeletePipelineRun).click({ force: true });
  },
);

Then('pipeline run is deleted from pipeline runs page', () => {
  // Reload is added, because pipeline run is not getting deleted immediately
  cy.reload();
  cy.get(pipelineRunsPO.pipelineRunsTable.table)
    .find('tr')
    .then(($ele) => {
      numOfPipelineRunsAfterDeletion = $ele.length;
      expect(numOfPipelineRunsAfterDeletion).toBeLessThan(numOfPipelineRunsBeforeDeletion);
    });
});

When('user clicks Delete button present in Delete PipelineRun modal', () => {
  modal.modalTitleShouldContain('Delete PipelineRun?');
  modal.submit(true);
  modal.shouldBeClosed();
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

Then('status displays as {string} in pipeline run details page', (pipelineStatus: string) => {
  cy.get(pipelineRunsPO.pipelineRunsTable.status).should('contain.text', pipelineStatus, {
    timeout: 10000,
  });
});

Then('user will be redirected to Pipeline Run Details page', () => {
  pipelineRunDetailsPage.verifyTitle();
});

Then('page will be redirected to pipeline runs page', () => {
  pipelineRunsPage.verifyTitle();
});

Then('user will remain on pipeline runs page', () => {
  pipelineRunsPage.verifyTitle();
});

Then('side bar is displayed with the pipelines section', () => {
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifySection(pageTitle.PipelineRuns);
});

Then('3 pipeline runs are displayed under pipelines section of topology page', () => {
  cy.get(topologyPO.sidePane.resourcesTab.pipelineRuns).should('not.be.greaterThan', 3);
});

Then('View all link is displayed', () => {
  cy.get(topologyPO.sidePane.pipelineRunsLinks).should('contain.text', 'View all');
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

Then('Last Run status of the workload displays as {string} in topology page', (status: string) => {
  topologySidePane.verify();
  topologyPage.verifyPipelineRunStatus(status);
});

When('user clicks Actions menu on the top right corner of the page', () => {
  actionsDropdownMenu.clickActionMenu();
});

When(
  'user is able to see Actions menu options {string}, {string}, {string}, {string} in pipeline run page',
  (el1, el2, el3, el4: string) => {
    cy.byLegacyTestID('breadcrumb-link-0').contains('PipelineRun');
    cy.byLegacyTestID('action-items')
      .should('contain', el1)
      .and('contain', el2)
      .and('contain', el3)
      .and('contain', el4);
  },
);

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

Then('Actions menu contains options {string}, {string}', (option1: string, option2: string) => {
  actionsDropdownMenu.clickActionMenu();
  cy.byTestActionID(option1).should('be.visible');
  cy.byTestActionID(option2).should('be.visible');
});

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
  cy.get(pipelineDetailsPO.details.fieldNames.list).should('be.visible');
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

Given('user is at pipeline page in developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Pipelines);
});

Given('a failed pipeline is present', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.ImportFromGit);
  gitPage.enterGitUrl('https://github.com/che-samples/java-spring-petclinic/tree/devfilev2');
  devFilePage.verifyValidatedMessage(
    'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2',
  );
  gitPage.selectAddPipeline();
  gitPage.clickCreate();
  topologyPage.verifyTopologyPage();
});

When('user goes to failed pipeline run of pipeline {string}', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get(`[data-test-id^="${pipelineName}-"]`).click();
});

When('user opens pipeline run details', () => {
  cy.get('.pf-c-breadcrumb').should('include.text', 'PipelineRun details');
});

Then('user can see status as Failure', () => {
  cy.get(pipelineRunsPO.pipelineRunsTable.status, { timeout: 20000 }).should(
    'include.text',
    'Failed',
  );
});

Then('user can view failure message under Message heading', () => {
  cy.get(pipelineRunDetailsPO.statusMessage).within(() => {
    cy.get('dl dt')
      .contains('Message')
      .should('be.visible');
  });
});

Then('user can see Log snippet to get know what taskruns failed', () => {
  cy.get(pipelineRunDetailsPO.statusMessage).within(() => {
    cy.get('dl dt')
      .contains('Log snippet')
      .should('be.visible');
  });
});

Given('user has passed pipeline run', () => {
  cy.exec(
    `oc apply -f testData/pipelines-workspaces/sum-three-pipeline.yaml -n ${Cypress.env(
      'NAMESPACE',
    )}`,
  );
});

When(
  'user is on Pipeline Run details page of {string} pipeline run',
  (pipelineRunsName: string) => {
    cy.get(`[data-test-id^="${pipelineRunsName}"]`).click();
  },
);

When('user scrolls to the Pipeline Run results section', () => {
  cy.get(pipelineRunDetailsPO.pipelineRunsResults).should('be.visible');
});

Then('user can see Name and Value column under Pipeline Run results', () => {
  cy.get(pipelineRunsPO.pipelineRunsTable.resultTable).should('contain.text', 'Name');
  cy.get(pipelineRunsPO.pipelineRunsTable.resultTable).should('contain.text', 'Value');
});

Given('a node with an associated pipeline {string} is present', (pipelineName: string) => {
  topologyPage.componentNode(pipelineName).should('be.visible');
});

When('user opens sidebar of the node {string}', (name: string) => {
  topologyPage.componentNode(name).click({ force: true });
});

When('user scrolls down to pipeline runs section', () => {
  cy.get(topologyPO.sidePane.pipelineRunsDetails)
    .contains('PipelineRuns')
    .should('be.visible');
});

Then('user will see the pipeline run name with failed status', () => {
  cy.get(pipelinesPO.pipelinesTable.lastRunStatus)
    .contains('Failed')
    .should('be.visible');
});

Then('user will see failure message below pipeline runs', () => {
  cy.get(topologyPO.sidePane.pipelineRunsStatus).should('be.visible');
});

Then('user will also see the log snippet', () => {
  cy.get(topologyPO.sidePane.pipelineRunsLogSnippet).should('be.visible');
});

Then('user navigates to pipelineRun parameters tab', () => {
  pipelineRunDetailsPage.selectTab('Parameters');
});

Then('user is able to see parameters of pipelineRun', () => {
  cy.get(pipelineRunDetailsPO.parameters.form).should('be.visible');
});

Then('user is able to see No parameters are associated with this PipelineRun', () => {
  cy.contains('No parameters are associated with this PipelineRun.');
});

Given('pipeline run is displayed for {string} with parameters', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithParameters(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get('[title="PipelineRun"]').should('be.visible');
});

Then(
  'user is able to see name {string} and value {string} parameters value of pipelineRun',
  (paramName: string, paramValue: string) => {
    cy.byTestID('name').should('have.value', paramName);
    cy.byTestID('value').should('have.value', paramValue);
  },
);

When('user creates pipeline using git named {string}', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.ImportFromGit);
  gitPage.enterGitUrl('https://github.com/sclorg/golang-ex');
  devFilePage.verifyValidatedMessage('https://github.com/sclorg/golang-ex');
  gitPage.selectAddPipeline();
  gitPage.enterWorkloadName(pipelineName);
  gitPage.clickCreate();
  topologyPage.verifyTopologyPage();
});

When('user is at the Pipeline Details page of pipeline {string}', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.byLegacyTestID(pipelineName).click();
  pipelineDetailsPage.verifyTitle(pipelineName);
});

When('user starts the pipeline {string} in Pipeline Details page', (pipelineName: string) => {
  pipelineDetailsPage.verifyTitle(pipelineName);
  cy.get(triggerTemplateDetailsPO.detailsTab)
    .should('be.visible')
    .click();
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.clickStart();
});
