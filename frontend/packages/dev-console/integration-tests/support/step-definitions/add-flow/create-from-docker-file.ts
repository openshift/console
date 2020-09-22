import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add-flow/add-page';
import { addOptions } from '../../constants/add';

Given('user is on Import from Docker file page', () => {
  addPage.selectCardFromOptions(addOptions.DockerFile);
});

When('user enters docker git url as {string}', (gitUrl: string) => {
  addPage.enterGitUrl(gitUrl);
  addPage.verifyValidatedMessage();
});

When('user selects {string} radio button in Resoruce type section', (resourceType: string) => {
  addPage.selectResource(resourceType);
});

When('user clicks Cancel button on Add page', () => {
  addPage.clickCancel();
});
