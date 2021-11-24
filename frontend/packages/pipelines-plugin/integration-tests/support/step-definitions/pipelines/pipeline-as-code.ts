import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  pageTitle,
} from '@console/dev-console/integration-tests/support/constants';
import { formPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  editAnnotations,
  navigateTo,
  yamlEditor,
} from '@console/dev-console/integration-tests/support/pages';
import { pipelineActions, pipelineTabs, repositoryDetailsTabs } from '../../constants';
import { createRepositoryPO } from '../../page-objects';
import { pipelinesPage, repositoryDetailsPage, repositoriesPage } from '../../pages';
import { actionsDropdownMenu, tableFunctions } from '../../pages/functions/common';

Given('user has installed pipelines as code', () => {
  // Steps to install pipeline as code feature : https://gist.github.com/chmouel/272df2cfbeef5606ca36d29a9a2d2f96
  cy.exec(
    `oc apply -f https://raw.githubusercontent.com/openshift-pipelines/pipelines-as-code/release-0.1/release-0.1.yaml`,
    {
      failOnNonZeroExit: false,
    },
  );
  cy.exec(`oc expose service el-pipelines-as-code-interceptor -n pipelines-as-code`, {
    failOnNonZeroExit: false,
  });
});

Given('user is at repositories page', () => {
  pipelinesPage.selectTab(pipelineTabs.Repositories);
});

When('user clicks on Create Repository button', () => {
  pipelinesPage.clickCreateRepository();
});

Then('user will be redirected to Repositories yaml view page', () => {
  detailsPage.titleShouldContain(pageTitle.CreateRepository);
  yamlEditor.isLoaded();
});

When('user creates repository using YAML editor from {string}', (yamlLocation: string) => {
  pipelinesPage.clearYAMLEditor();
  pipelinesPage.setEditorContent(yamlLocation);
  cy.get(createRepositoryPO.create).click();
});

Then(
  'user will be redirected to Repository details page with header name {string}',
  (repositoryName: string) => {
    detailsPage.titleShouldContain(repositoryName);
  },
);

Given(
  'repository {string} is present in Repositories tab of Pipelines page',
  (repoName: string) => {
    pipelinesPage.selectTab(pipelineTabs.Repositories);
    pipelinesPage.search(repoName);
    pipelinesPage.verifyPipelinesTableDisplay();
  },
);

When('user clicks on the repository {string} on Repositories page', (repoName: string) => {
  cy.byLegacyTestID(repoName).click();
});

Then(
  'user will be redirected to Repository details page with header {string}',
  (repoName: string) => {
    detailsPage.titleShouldContain(repoName);
    cy.get('[title="Repository"]').should('be.visible');
  },
);

Then('user is able to see Details, YAML, Pipeline Runs tabs', () => {
  repositoryDetailsPage.verifyTabs();
});

Then(
  'Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created at, Owner, Repository, Branch and Event type',
  () => {
    repositoryDetailsPage.verifyFieldsInDetailsTab();
  },
);

Then('Actions dropdown display in the top right corner of the page', () => {
  actionsDropdownMenu.verifyActionsMenu();
});

Given('repository {string} is present on the Repositories page', (repoName: string) => {
  pipelinesPage.selectTab(pipelineTabs.Repositories);
  pipelinesPage.search(repoName);
});

When('user searches repository {string} in repositories page', (repoName: string) => {
  pipelinesPage.search(repoName);
});

Then(
  'repositories table displayed with column names Name, Event type, Last run, Task status, Last run status, Last run time, Last run duration',
  () => {
    repositoriesPage.verifyRepositoryTableColumns();
  },
);

Then('column Name display with value {string}', (name: string) => {
  repositoriesPage.verifyNameInRepositoriesTable(name);
});

Then(
  'columns Last run, Task status, Last run status, Last run time, Last run duration with values display {string}',
  (value: string) => {
    tableFunctions.verifyColumnValue('Last run', value);
    tableFunctions.verifyColumnValue('Task status', value);
    tableFunctions.verifyColumnValue('Last run status', value);
    tableFunctions.verifyColumnValue('Last run time', value);
    tableFunctions.verifyColumnValue('Last run duration', value);
  },
);

When('user clicks on kebab menu of the repository {string}', (repoName: string) => {
  tableFunctions.selectKebabMenu(repoName);
});

Then(
  'kebab menu displays with options Edit labels, Edit annotations, Edit repository, Delete repository',
  () => {
    cy.byTestActionID(pipelineActions.EditLabels).should('be.visible');
    cy.byTestActionID(pipelineActions.EditAnnotations).should('be.visible');
    cy.byTestActionID(pipelineActions.EditRepository).should('be.visible');
    cy.byTestActionID(pipelineActions.DeleteRepository).should('be.visible');
  },
);

Then(
  'Actions menu display with options Edit labels, Edit annotations, Edit repository, Delete repository',
  () => {
    actionsDropdownMenu.verifyActionsMenu();
    actionsDropdownMenu.clickActionMenu();
    cy.byTestActionID('Edit labels').should('be.visible');
    cy.byTestActionID('Edit annotations').should('be.visible');
    cy.byTestActionID('Edit Repository').should('be.visible');
    cy.byTestActionID('Delete Repository').should('be.visible');
  },
);

When(
  'user clicks repository {string} from searched results on Repositories page',
  (repoName: string) => {
    cy.byLegacyTestID(repoName).click();
    detailsPage.titleShouldContain(repoName);
  },
);

Then('user modifies the yaml code in the yaml view of the repository', () => {
  yamlEditor.isLoaded();
  // yamlEditor.replace - Replace the content
});

Then('user clicks on the save button', () => {
  cy.get(formPO.save).click();
});

Then('user is able to see a success alert message on same page', () => {
  cy.get(formPO.successAlert).should('be.visible');
});

When('adds the label {string}', (label: string) => {
  cy.byTestID('tags-input').type(`${label}{Enter}`);
});

When('user clicks on the Save button', () => {
  modal.submit();
  modal.shouldBeClosed();
});

Then('label {string} should be present in the labels section', (label: string) => {
  repositoryDetailsPage.selectTab(repositoryDetailsTabs.Details);
  repositoryDetailsPage.verifyLabelInLabelsList(label);
});

When('user adds key {string} and value {string}', (key: string, value: string) => {
  editAnnotations.enterKey(key);
  editAnnotations.enterValue(value);
});

Then('annotation section contains the value {string}', (numOfAnnotations: string) => {
  repositoryDetailsPage.verifyAnnotations(numOfAnnotations);
});

When('user clicks Delete button on Delete Repository modal', () => {
  modal.modalTitleShouldContain('Delete Repository?');
  modal.submit();
  modal.shouldBeClosed();
});

Then('user will be redirected to Repositories page', () => {
  detailsPage.titleShouldContain('Repositories');
});

Then('{string} is not displayed on Repositories page', (repoName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectTab(pipelineTabs.Repositories);
  cy.byTestID('empty-message')
    .should('be.visible')
    .then(() => {
      cy.log(`${repoName} is deleted from namespace`);
    });
});
