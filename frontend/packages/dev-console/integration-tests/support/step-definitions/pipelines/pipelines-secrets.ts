import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelinesPage, startPipelineInPipelinsPage, pipelinesObj } from '../../pages/pipelines_page';
import { pipelineBuilderPage } from '../../pages/pipelineBuilder_page';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';

const store: Record<string, string> = {};

Given('user able to see pipeline {string} with git resources in pipeiles page', (pipelineName: string) => {
  pipelinesPage.createPipeline();
  pipelineBuilderPage.createPipelineWithGitresources(pipelineName);
  store.pipelineName = pipelineName;
});

When('clicks on Show Credentials link present in Start Pipeline popup', () => {
  cy.alertTitleShouldBe('Start Pipeline');
  startPipelineInPipelinsPage.clickShowCredentialOptions();
});

When('clicks on {string} link', (buttonName: string) => {
  cy.byButtonText(buttonName).click();
});

Then('user able to see Create Source Secret section', () => {
  startPipelineInPipelinsPage.verifyCreateSourceSecretSection();
});

Then('able to see Secret Name, Access to, Server UrL fields and authernication type fields', () => {
  startPipelineInPipelinsPage.verifyFields();
  cy.get(pipelinesObj.startPipeline.cancel).click();
});

Given('user is at Start Pipeline popup', () => {
  naviagteTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectKebabMenu(store.pipelineName);
  cy.byTestActionID('Start').click();
  cy.alertTitleShouldBe('Start Pipeline');
});

When('the user enters URL, Revision as {string} and {string}', (gitUrl: string, revision: string) => {
  startPipelineInPipelinsPage.addGitResource(gitUrl,revision);
});

When('enters Secret Name as {string}', (secretName: string) => {
  startPipelineInPipelinsPage.clickShowCredentialOptions();
  cy.byButtonText('Add Secret').click();
  cy.get(pipelinesObj.startPipeline.advancedOptions.secretName).type(secretName);
});

When('selects the {string} option from Access to drop down', (option: string) => {
  cy.selectByDropDownText(pipelinesObj.startPipeline.advancedOptions.accessTo, option);
});

When('enters the server url as {string}', (serverUrl: string) => {
  cy.get(pipelinesObj.startPipeline.advancedOptions.serverUrl).type(serverUrl);
});

When('selects the Authentication type as {string}', (authenticationType: string) => {
  cy.selectByDropDownText(pipelinesObj.startPipeline.advancedOptions.authenticationType, authenticationType);
});

When('enters the Username, Password as {string}, {string}', (userName: string, password: string) => {
  cy.get(pipelinesObj.startPipeline.advancedOptions.userName).type(userName);
  cy.get(pipelinesObj.startPipeline.advancedOptions.password).type(password);
});

When('clicks on tick mark', () => {
  cy.get(pipelinesObj.startPipeline.advancedOptions.tickIcon).click();
});

Then('{string} is added under secrets section', (secretName: string) => {
  cy.byLegacyTestID(secretName).should('be.visible');
  startPipelineInPipelinsPage.clicKCancel();
});

When('enters the SSH KEY as {string}', (sshkey: string) => {
  cy.get(pipelinesObj.startPipeline.advancedOptions.sshPrivateKey).type(sshkey);
});

When('enters the Username, Password, email as {string}, {string}, {string}', (userName: string, password: string, email: string) => {
  cy.get(pipelinesObj.startPipeline.advancedOptions.userName).type(userName);
  cy.get(pipelinesObj.startPipeline.advancedOptions.password).type(password);
  cy.get(pipelinesObj.startPipeline.advancedOptions.email).type(email);
});
