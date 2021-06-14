import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addOptions } from '../../constants';
import { gitPage, addPage, devFilePage } from '../../pages';

Given('user is on Import from Docker file page', () => {
  addPage.selectCardFromOptions(addOptions.DockerFile);
});

When('user enters docker git url as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  devFilePage.verifyValidatedMessage();
});

When('user selects {string} radio button in Resource type section', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

When('user clicks Cancel button on Add page', () => {
  gitPage.clickCancel();
});

Then('application name displays as {string}', (appName: string) => {
  gitPage.verifyAppName(appName);
});

Then(
  'name field auto populates with value {string} in Import from Docker file page',
  (nodeName: string) => {
    gitPage.verifyNodeName(nodeName);
    gitPage.clickCancel();
  },
);

When('user enters Name as {string} in Docker file page', (name: string) => {
  gitPage.enterComponentName(name);
});
