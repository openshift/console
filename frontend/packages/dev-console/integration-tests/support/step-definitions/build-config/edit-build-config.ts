import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { pipelineBuilderPO } from '@console/pipelines-plugin/integration-tests/support/page-objects';
import { pipelinesPage } from '@console/pipelines-plugin/integration-tests/support/pages';
import { devNavigationMenu } from '../../constants';
import { actionsMenu, devNavigationMenuPO, formPO, search } from '../../pageObjects';
import { eventSourcePO, gitPO, helmChartRepositoriesPO } from '../../pageObjects/add-flow-po';
import { buildConfigPO } from '../../pageObjects/buildConfig-po';
import { createGitWorkload, navigateTo, yamlEditor } from '../../pages';

Given('user has created a deployment workload {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment',
    'nodejs-ex-git-app',
  );
});

When('user navigates to build tab', () => {
  cy.get(devNavigationMenuPO.builds).click();
  cy.get(buildConfigPO.resourceTitle).should('be.visible');
});

When('user clicks on kebab menu for {string} build config', (nodeName: string) => {
  cy.get(search).type(nodeName);
  cy.get(buildConfigPO.kebabButton).eq(0).click();
});

When('user clicks on Edit BuildConfig', () => {
  cy.byTestActionID('Edit BuildConfig').click();
});

Then('user will see the Name field', () => {
  cy.byTestID('section name').should('be.visible');
  cy.get(buildConfigPO.nameField).should('be.disabled');
});

Then('user will see the Git repository url field', () => {
  cy.get(gitPO.gitRepoUrl).should('be.visible');
});

Then('user will see the Image configuration section', () => {
  cy.byTestID('section images').should('be.visible');
});

Then('user will see the Environment Variables section', () => {
  cy.byTestID('section environment-variables').scrollIntoView().should('be.visible');
});

Given('user is at Edit Build Config page of deployment {string}', (nodeName: string) => {
  navigateTo(devNavigationMenu.Builds);
  cy.get(search).type(nodeName);
  cy.get(buildConfigPO.kebabButton).eq(0).click();
  cy.byTestActionID('Edit BuildConfig').click();
  cy.get(helmChartRepositoriesPO.formTitle).should('be.visible').contains('Edit BuildConfig');
});

When('user clicks on Advanced option {string}', (optionName: string) => {
  cy.byTestID('section advanced-options').scrollIntoView();
  cy.byButtonText(optionName).click();
});

Then('user will see section {string}', (sectionName: string) => {
  cy.byTestID(`section ${sectionName.toLowerCase()}`).should('be.visible');
});

When('user switches to YAML view', () => {
  cy.get(helmChartRepositoriesPO.yaml.yamlSwitcher).click();
  cy.byTestID(helmChartRepositoriesPO.yaml.yamlEditor).should('be.visible');
});

When('user changes spec.output.to.name to {string}', (yamlLocation: string) => {
  yamlEditor.isLoaded();
  pipelinesPage.clearYAMLEditor();
  pipelinesPage.setEditorContent(yamlLocation);
  cy.get(pipelineBuilderPO.create).click();
});

When('user switches to Form view', () => {
  cy.get(eventSourcePO.formView).click();
  cy.get(helmChartRepositoriesPO.yaml.yamlEditor).should('not.be.visible');
});

When('user changes Git Rpository URL to {string} menu of build config', (gitRepoUrl: string) => {
  cy.get(gitPO.gitRepoUrl).clear().type(gitRepoUrl);
  cy.get(gitPO.gitRepoUrl).should('have.value', gitRepoUrl);
});

When(
  'user selects imagestream {string} and tag {string} in Build From section in Image Configuration',
  (imageStream: string, imageStreamTag: string) => {
    cy.get(buildConfigPO.buildFrom.imageStreamDropdown).click();
    cy.get(eventSourcePO.createSinkBinding.resourceSearchField).type(imageStream);
    cy.get(eventSourcePO.createSinkBinding.resourceDropDownItem).eq(0).click();
    cy.get(buildConfigPO.buildFrom.imageStreamTagDropdown).click();
    cy.get(eventSourcePO.createSinkBinding.resourceSearchField).type(imageStreamTag);
    cy.get(eventSourcePO.createSinkBinding.resourceDropDownItem).eq(1).click();
  },
);

When(
  'user enters Name and Value as {string} and {string} respectively in Environment Variables',
  (name: string, value: string) => {
    cy.get(gitPO.advancedOptions.deployment.envName).scrollIntoView().type(name);
    cy.get(gitPO.advancedOptions.deployment.envValue).scrollIntoView().type(value);
  },
);

When('user selects External container image option from Build from dropdown', () => {
  cy.get(buildConfigPO.buildFrom.buildTypeDropdown).click();
  cy.byTestDropDownMenu('dockerImage').click();
});

When('user enters image registry as {string}', (containerImage: string) => {
  cy.get(buildConfigPO.imageRegistryField).clear().type(containerImage);
});

When('user click Save button on Edit build Config page', () => {
  cy.get(formPO.create).click();
});

Then(
  'user will see Git Repository as {string} and Build from as {string} imagestream',
  (gitRepoUrl: string, imageStream: string) => {
    cy.byTestSelector('details-item-value__Git repository').should('have.text', gitRepoUrl);
    cy.byTestSelector('details-item-value__Build from')
      .byTestID(imageStream)
      .should('have.text', imageStream);
  },
);

Given('user has applied the yaml {string}', (yamlFile: string) => {
  const yamlFileName = `testData/yamls/BuildConfig/${yamlFile}`;
  navigateTo(devNavigationMenu.Add);
  cy.byTestID('item import-yaml').click();
  yamlEditor.isLoaded();
  yamlEditor.setEditorContent(yamlFileName);
  cy.get(formPO.save).click();
});

When('user clicks on action menu of build config', () => {
  cy.get(actionsMenu).click();
  cy.get(buildConfigPO.actionItems).should('be.visible');
});

When('user selects the option Edit BuildConfig', () => {
  cy.byTestActionID('Edit BuildConfig').click();
});

When('user clicks Show advanced Git options', () => {
  cy.contains('Show advanced Git options').click();
  cy.get(gitPO.advancedOptions.buildConfig.advanceGitOptions).should('be.visible');
});

When('user changes value of Context Dir to {string}', (dir: string) => {
  cy.get(buildConfigPO.contentDirectoryField).clear().type(dir);
});

Then('user will see Context dir as {string}', (dir: string) => {
  cy.byTestSelector('details-item-value__Context dir').should('have.text', dir);
});

When('user click Save button on a Edit build Config page', () => {
  cy.get(formPO.create).click();
});

When('user goes to Environment tab', () => {
  // user is not redirected automatically, user has to naviagte back to the tab
  cy.get(buildConfigPO.environmentTab).click();
});

Then(
  'user will see Name as {string} and and Value as {string} in Environment Variables',
  (name: string, value: string) => {
    cy.get(gitPO.advancedOptions.buildConfig.envName)
      .scrollIntoView()
      .should('be.visible')
      .should('have.value', name);
    cy.get(gitPO.advancedOptions.buildConfig.envValue)
      .scrollIntoView()
      .should('be.visible')
      .should('have.value', value);
  },
);

When('And user goes to Environment tab', () => {
  cy.get(helmChartRepositoriesPO.cancelButton).click();
  cy.get(buildConfigPO.environmentTab).click();
  cy.get(gitPO.advancedOptions.buildConfig.envName).scrollIntoView().should('be.visible');
  cy.get(gitPO.advancedOptions.buildConfig.envValue).scrollIntoView().should('be.visible');
});
