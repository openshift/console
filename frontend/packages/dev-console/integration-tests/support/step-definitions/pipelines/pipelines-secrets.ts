import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelinesPage, startPipelineInPipelinesPage } from '../../pages/pipelines/pipelines-page';
import { pipelineBuilderPage } from '../../pages/pipelines/pipelineBuilder-page';
import { navigateTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { pipelinesPO } from '../../pageObjects/pipelines-po';

const store: Record<string, string> = {};

Given('user has created pipeline {string} with git resources', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
  store.pipelineName = pipelineName;
});

When('user clicks on Show Credentials link present in Start Pipeline modal', () => {
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.clickShowCredentialOptions();
});

When('user clicks on {string} link', (buttonName: string) => {
  cy.byButtonText(buttonName).click();
});

Then('user is able to see Create Source Secret section', () => {
  startPipelineInPipelinesPage.verifyCreateSourceSecretSection();
});

Then(
  'user is able to see Secret Name, Access to, Server UrL fields and authentication type fields',
  () => {
    startPipelineInPipelinesPage.verifyFields();
    cy.get(pipelinesPO.startPipeline.cancel).click();
  },
);

Given('user is at Start Pipeline modal for pipeline {string}', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID('Start').click();
  modal.modalTitleShouldContain('Start Pipeline');
});

When('user enters URL, Revision as {string} and {string}', (gitUrl: string, revision: string) => {
  startPipelineInPipelinesPage.addGitResource(gitUrl, revision);
});

When('user enters Secret Name as {string}', (secretName: string) => {
  startPipelineInPipelinesPage.clickShowCredentialOptions();
  cy.byButtonText('Add Secret').click();
  cy.get(pipelinesPO.startPipeline.advancedOptions.secretName).type(secretName);
});

When('user selects the {string} option from accessTo drop down', (option: string) => {
  cy.selectByDropDownText(pipelinesPO.startPipeline.advancedOptions.accessTo, option);
});

When('user enters the server url as {string}', (serverUrl: string) => {
  cy.get(pipelinesPO.startPipeline.advancedOptions.serverUrl).type(serverUrl);
});

When('user selects the Authentication type as {string}', (authenticationType: string) => {
  cy.selectByDropDownText(
    pipelinesPO.startPipeline.advancedOptions.authenticationType,
    authenticationType,
  );
});

When(
  'user enters the Username, Password as {string}, {string}',
  (userName: string, password: string) => {
    cy.get(pipelinesPO.startPipeline.advancedOptions.userName).type(userName);
    cy.get(pipelinesPO.startPipeline.advancedOptions.password).type(password);
  },
);

When('user clicks on tick mark', () => {
  cy.get(pipelinesPO.startPipeline.advancedOptions.tickIcon).click();
});

Then('{string} is added under secrets section', (secretName: string) => {
  cy.byLegacyTestID(secretName).should('be.visible');
  startPipelineInPipelinesPage.clickCancel();
});

When('user enters the SSH KEY as {string}', (sshKey: string) => {
  cy.get(pipelinesPO.startPipeline.advancedOptions.sshPrivateKey).type(sshKey);
});

When(
  'user enters the Username, Password, email as {string}, {string}, {string}',
  (userName: string, password: string, email: string) => {
    cy.get(pipelinesPO.startPipeline.advancedOptions.userName).type(userName);
    cy.get(pipelinesPO.startPipeline.advancedOptions.password).type(password);
    cy.get(pipelinesPO.startPipeline.advancedOptions.email).type(email);
  },
);
