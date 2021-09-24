import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addOptions } from '../../constants';
import { gitPage, addPage, devFilePage } from '../../pages';

Given('user is on Import from Git form', () => {
  addPage.selectCardFromOptions(addOptions.DockerFile);
});

When('user enters Git Repo URL as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  devFilePage.verifyValidatedMessage(gitUrl);
});

When('user enters Git Repo URL as {string} in Import from Git form', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  devFilePage.verifyValidatedMessage(gitUrl);
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
  'name field auto populates with value {string} in Import from Git form',
  (nodeName: string) => {
    gitPage.verifyNodeName(nodeName);
    gitPage.clickCancel();
  },
);

When('user enters Name as {string} in Docker file page', (name: string) => {
  gitPage.enterComponentName(name);
});
