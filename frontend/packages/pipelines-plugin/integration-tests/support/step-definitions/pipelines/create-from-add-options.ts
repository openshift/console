import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  addOptions,
  messages,
} from '@console/dev-console/integration-tests/support/constants';
import {
  topologyPage,
  topologySidePane,
  navigateTo,
  gitPage,
  catalogPage,
  addPage,
  createGitWorkload,
  dockerfilePage,
} from '@console/dev-console/integration-tests/support/pages';
import { pipelinesPage, pipelineRunDetailsPage } from '../../pages';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { pipelineRunDetailsPO } from '../../page-objects/pipelines-po';
import { gitPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { pipelineActions } from '../../constants';

Given('user is at Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user clicks From Git card on the Add page', () => {
  addPage.selectCardFromOptions(addOptions.Git);
});

Then('user will be redirected to Import from git form', () => {
  detailsPage.titleShouldContain('Import from Git');
});

Given('user is at Import from Git form', () => {
  addPage.selectCardFromOptions(addOptions.Git);
});

Then('user will be redirected to Import from Git form', () => {
  detailsPage.titleShouldContain('Import from Git');
});

Then('user will be redirected to Import from Dockerfile form', () => {
  detailsPage.titleShouldContain('Import from Dockerfile');
});

Then('pipeline section is displayed with message {string}', (message: string) => {
  gitPage.verifyPipelineInfoMessage(message);
  gitPage.clickCancel();
});

When('user enters Git Repo url in docker file as {string}', (gitRepoUrl: string) => {
  gitPage.enterGitUrl(gitRepoUrl);
  cy.get(gitPO.gitSection.validatedMessage).should('not.have.text', 'Validating...');
  cy.get('body').then(($body) => {
    if (
      $body
        .find(gitPO.gitSection.validatedMessage)
        .text()
        .includes(messages.addFlow.privateGitRepoMessage) ||
      $body
        .find(gitPO.gitSection.validatedMessage)
        .text()
        .includes(messages.addFlow.rateLimitExceeded) ||
      $body.find('[aria-label="Warning Alert"]').length
    ) {
      gitPage.enterGitUrl(gitRepoUrl);
    }
  });
});

When('user enters Git Repo url in builder image as {string}', (gitRepoUrl: string) => {
  gitPage.enterGitUrl(gitRepoUrl);
  cy.get(gitPO.gitSection.validatedMessage).should('not.have.text', 'Validating...');
});

When('user clicks From Dockerfile card on the Add page', () => {
  addPage.selectCardFromOptions(addOptions.DockerFile);
});

Given('user is on Import from Docker file page', () => {
  addPage.selectCardFromOptions(addOptions.DockerFile);
});

Then('Add pipeline section is displayed', () => {
  gitPage.verifyPipelineCheckBox();
  gitPage.clickCancel();
});

Given('pipeline {string} is executed for 5 times', (pipelineName: string) => {
  pipelinesPage.search(pipelineName);
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
  pipelineRunDetailsPage.verifyTitle();
  cy.get(pipelineRunDetailsPO.pipelineRunStatus).should('not.have.text', 'Running');
  cy.selectActionsMenuOption(pipelineActions.Rerun);
  cy.get(pipelineRunDetailsPO.pipelineRunStatus).should('not.have.text', 'Running');
  cy.selectActionsMenuOption(pipelineActions.Rerun);
  cy.get(pipelineRunDetailsPO.pipelineRunStatus).should('not.have.text', 'Running');
  cy.selectActionsMenuOption(pipelineActions.Rerun);
  cy.get(pipelineRunDetailsPO.pipelineRunStatus).should('not.have.text', 'Running');
  cy.selectActionsMenuOption(pipelineActions.Rerun);
  cy.get(pipelineRunDetailsPO.pipelineRunStatus).should('not.have.text', 'Running');
});

Then('Add pipeline checkbox is displayed', () => {
  gitPage.verifyPipelineCheckBox();
  gitPage.clickCancel();
});

When('user enters Name as {string} in General section', (name: string) => {
  gitPage.enterComponentName(name);
});

When('user enters Name as {string} in General section of Dockerfile page', (name: string) => {
  dockerfilePage.enterName(name);
});

When('user selects Add Pipeline checkbox in Pipelines section', () => {
  gitPage.selectAddPipeline();
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Given('workload {string} is added to namespace', (componentName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(componentName);
});

When('user searches for {string} in topology page', (name: string) => {
  topologyPage.search(name);
});

When('user searches for pipeline {string} in pipelines page', (name: string) => {
  pipelinesPage.search(name);
});

When('user clicks node {string} in topology page', (name: string) => {
  topologyPage.componentNode(name).click({ force: true });
});

Then('pipeline name {string} is displayed in topology side bar', (appName: string) => {
  topologySidePane.verify();
  topologySidePane.verifyTitle(appName);
});

Then('pipeline {string} is displayed in pipelines page', (pipelineName: string) => {
  pipelinesPage.verifyNameInPipelinesTable(pipelineName);
});

Given('user created workload {string} from add page with pipeline', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.Git);
  gitPage.enterGitUrl('https://github.com/sclorg/nodejs-ex.git');
  gitPage.verifyValidatedMessage('https://github.com/sclorg/nodejs-ex.git');
  gitPage.enterComponentName(pipelineName);
  gitPage.selectAddPipeline();
  gitPage.clickCreate();
  topologyPage.verifyTopologyPage();
});

Given('user is at Developer Catalog form with builder images', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('user searches builder image {string} in developer catalog', (searchItem: string) => {
  catalogPage.search(searchItem);
});

When('user creates the application with the selected builder image', () => {
  catalogPage.isCardsDisplayed();
  // To Do
});

When('user clicks Create button on Create Source-to-Image application', () => {
  gitPage.clickCreate();
});

Given(
  'user has created a Git workload {string} from Add page with pipeline selection',
  (workloadName: string) => {
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      workloadName,
      'Deployment',
      'nodejs-ex-git-app',
      true,
    );
  },
);

When('user clicks Create button on Add page', () => {
  gitPage.clickCreate();
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

When('user clicks From Git card on the Add page', () => {
  addPage.selectCardFromOptions(addOptions.Git);
});

Then('user will be redirected to Import from Git form', () => {
  detailsPage.titleShouldContain('Import from Git');
});

When('user selects resource type as {string}', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

Then('user can see sidebar opens with Resources tab selected by default', () => {
  topologySidePane.verifySelectedTab('Resources');
});
