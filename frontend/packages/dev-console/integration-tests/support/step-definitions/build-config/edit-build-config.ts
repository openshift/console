import { When, Given, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import {
  pageTitle,
  resources,
  resourceTypes,
  sideBarTabs,
} from '@console/dev-console/integration-tests/support/constants';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import {
  createGitWorkload,
  gitPage,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';
import {
  navigateTo,
  tableFunctions,
  createForm,
} from '@console/dev-console/integration-tests/support/pages/app';

const gitUrl = 'https://github.com/sclorg/nodejs-ex.git';

Given('user has created a deployment workload {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(gitUrl, componentName, resourceTypes.DeploymentConfig, 'nodejs-ex-git-app');
});

When('user navigates to buildConfig of workload {string}', (workload: string) => {
  topologyPage.clickOnNode(workload);
  topologySidePane.selectTab(sideBarTabs.Resources);
  topologySidePane.selectResource(resources.BuildConfigs, Cypress.env('NAMESPACE'), workload);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  detailsPage.titleShouldContain(pageTitle.BuildConfigs);
});

When('user clicks on kebab menu for {string} build config', (buildConfig: string) => {
  tableFunctions.selectKebabMenu(buildConfig);
});

Given('user is at Edit Build Config page of deployment {string}', (buildConfig: string) => {
  tableFunctions.selectKebabMenu(buildConfig);
  cy.byTestActionID('Edit BuildConfig').click();
  cy.byTestID('loading-indicator').should('not.exist');
});

When('user clicks on Edit BuildConfig', () => {
  cy.byTestActionID('Edit BuildConfig').click();
  // On Edit build config page, url always gets validated, so below code is needed
  cy.get('body').then(($body) => {
    if ($body.find('[data-test-id="git-form-input-url"]').length !== 0) {
      gitPage.verifyValidatedMessage(gitUrl);
    }
  });
});

Then('user will see the Name field as disabled', () => {
  cy.get('#form-input-formData-name-field').should('have.attr', 'disabled');
});

Then('user will see the Git repository url field', () => {
  cy.byLegacyTestID('git-form-input-url').should('be.visible');
});

Then('user will see the Image configuration section', () => {
  cy.byTestID('section images').should('be.visible');
});

Then('user will see the Environment Variables section', () => {
  cy.byTestID('section environment-variables')
    .scrollIntoView()
    .should('be.visible');
});

When('user clicks on Advanced option {string}', (option: string) => {
  cy.get('button')
    .contains(option)
    .click();
});

Then('user will see section {string}', (sectionName: string) => {
  sectionName === 'Run Policy'
    ? cy.byTestID(`section policy`).should('be.visible')
    : cy.byTestID(`section ${sectionName.toLowerCase()}`).should('be.visible');
});

When('user changes Git Repository URL to {string} menu of build config', (gitRepoUrl: string) => {
  gitPage.enterGitUrl(gitRepoUrl);
});

When(
  'user selects imageStream {string} and tag {string} in Build From section in Image Configuration',
  (imageStream: string, tag: string) => {
    cy.selectByAutoCompleteDropDownText('[id$="imageStream-image-field"]:first', imageStream);
    cy.selectByAutoCompleteDropDownText('[id$="imageStream-tag-field"]:first', tag);
  },
);

When(
  'user enters Name and Value as {string} and {string} respectively in Environment Variables',
  (name: string, value: string) => {
    cy.byTestID('pairs-list-name')
      .clear()
      .type(name);
    cy.byTestID('pairs-list-value')
      .clear()
      .type(value);
  },
);

When('user clicks Save button on Edit Build Config page', () => {
  createForm.clickSave();
});

Then('user is able to see the message as {string}', () => {
  cy.contains('This object has been updated.').should('be.visible');
});

Given('user has applied the yaml {string}', (yamlFile: string) => {
  cy.exec(`oc apply -f ${yamlFile} -n ${Cypress.env('NAMESPACE')}`);
});

When('user clicks on action menu of build config', () => {
  // TODO: implement step
});

When('user clicks Show advanced Git options', () => {
  cy.contains('Show advanced Git options').click();
});

When('user changes value of Context Dir to {string}', (contextDir: string) => {
  cy.get('#form-input-formData-source-git-git-dir-field')
    .clear()
    .type(contextDir);
});

Then('user will see Context dir as {string}', (contextDir: string) => {
  cy.get('#form-input-formData-source-git-git-dir-field').should('have.value', contextDir);
});

Then(
  'user will see Name as {string} and and Value as {string} in Environment Variables section',
  (name: string, value: string) => {
    cy.byTestID('pairs-list-name')
      .scrollIntoView()
      .should('have.value', name);
    cy.byTestID('pairs-list-value')
      .scrollIntoView()
      .should('have.value', value);
  },
);
