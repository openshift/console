import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {loginPage} from '../../pages/login_page';
import { perspective, projectNameSpace } from '../../pages/app';
import { switchPerspective } from '../../constants/global';

Given('user is logged into the openshift application', () => {
  loginPage.loginWithValidCredentials('kubeadmin', 'VpTYd-4YMhN-p3Q8f-PfNsz');
  loginPage.checkLoginSuccess();
});

Given('user is on dev perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
});

When('user selects the Create Project option from Projects dropdown on top navigation bar', () => {
  projectNameSpace.selectCreateProjectOption();
});

When('type Name as {string} in Create Project popup', (projectName: string) => {
  projectNameSpace.enterProjectName(projectName);
});

When('click Create button present in Create Project popup', () => {
  projectNameSpace.clickCreateButton();
});
  
Then('popup should get closed', () => {
  projectNameSpace.verifyPopupClosed();
});

Then('page displays with message {string}', (message: string) => {
  projectNameSpace.verifyMessage(message);
});
