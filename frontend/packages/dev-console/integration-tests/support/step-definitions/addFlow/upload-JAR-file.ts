import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { addOptions } from '../../constants';
import { gitPO, uploadJarFilePO } from '../../pageObjects';
import { addPage, gitPage } from '../../pages';
import { uploadJarFilePage } from '../../pages/add-flow/upload-jar-file-page';

When('user clicks on the Upload JAR file card', () => {
  addPage.selectCardFromOptions(addOptions.UploadJARFile);
});

When('user clicks on Browse in JAR file section', () => {
  uploadJarFilePage.clickBrowse();
});

When('user selects appropriate Build image version', () => {
  uploadJarFilePage.selectBuilderImageVersion('');
});

When(
  'user gives Application name as {string} and workload Name as {string}',
  (appName: string, workloadName: string) => {
    gitPage.enterAppName(appName);
    gitPage.enterComponentName(workloadName);
  },
);

When('user clicks create button', () => {
  gitPage.clickCreate();
});

Then(
  'user is able to see Upload jar file, Optional java commands, Run time Icon and Builder Image version fields displayed in JAR section',
  () => {
    cy.get(uploadJarFilePO.jar.jarFile).should('be.visible');
    cy.get(uploadJarFilePO.jar.optionalJavaCommands).should('be.visible');
    cy.get(uploadJarFilePO.jar.runTimeIcon).should('be.visible');
    cy.get(uploadJarFilePO.jar.builderImageVersion).should('be.visible');
  },
);

Then('Application Name, Name fields displayed in General section', () => {
  cy.get(gitPO.appName).should('be.visible');
  cy.get(gitPO.nodeName).should('be.visible');
});

Then('Resources section, Advanced options sections are displayed', () => {
  cy.get(gitPO.sectionTitle)
    .contains('Resources')
    .should('be.visible');
  cy.get(gitPO.resources.deployment).should('be.enabled');
  cy.get(gitPO.resources.deploymentConfig).should('be.enabled');
  cy.get(gitPO.sectionTitle)
    .contains('Advanced options')
    .scrollIntoView()
    .should('be.visible');
});

Given('user is at Upload JAR file form', () => {
  addPage.selectCardFromOptions(addOptions.UploadJARFile);
});

Then('Create button is in disabled state', () => {
  cy.byLegacyTestID('submit-button').should('be.disabled');
});
