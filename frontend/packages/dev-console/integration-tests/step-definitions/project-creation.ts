import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { loginPage } from '../support/pages/login_page';
import { perspective, projectNameSpace } from '../support/pages/app';

Given('user is logged into the openshift application', () => {
  loginPage.loginWithValidCredentials('kubeadmin', 'VpTYd-4YMhN-p3Q8f-PfNsz');
  loginPage.checkLoginSuccess();
});

Given('user is on dev perspective', () => {
  perspective.switchToDeveloper();
});

When('user selects the Create Project option from Projects dropdown on top navigation bar', () => {
  projectNameSpace.selectCreateProjectOption();
});

When('type Name as {string} in Create Project popup', (projectName) => {
  projectNameSpace.enterProjectName(projectName);
});

When('click Create button present in Create Project popup', () => {
  projectNameSpace.clickCreateButton();
});

Then('popup should get closed', () => {
  projectNameSpace.verifyPopupClosed();
});

Then('page displays with message {string}', (message) => {
  projectNameSpace.verifyMessage(message);
});
