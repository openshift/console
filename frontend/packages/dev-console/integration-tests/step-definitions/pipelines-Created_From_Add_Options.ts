import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { loginPage } from '../support/pages/login_page';
import { gitPage, seelctCardFromOptions } from '../support/pages/add_page';
import { perspective, projectNameSpace as project, naviagteTo } from '../support/pages/app';
import { devNavigationMenu as menu } from '../support/constants/global';
import { addOptions } from '../support/constants/addPage';

// before(() => {
//   loginPage.loginWithValidCredentials('kubeadmin', 'YcxoK-QLkqH-rh3Tr-qQdsJ');
//   loginPage.checkLoginSuccess();
//   app.createProject('AUT_MB_Demo');
// });

Given('openshift cluster is installed with pipeline operator', () => {
  loginPage.loginWithValidCredentials('kubeadmin', 'YcxoK-QLkqH-rh3Tr-qQdsJ');
  loginPage.checkLoginSuccess();
});

Given('user is at the project namespace {string} in dev perspecitve', (projectName) => {
  perspective.switchToDeveloper();
  project.createProject(projectName);
  project.selectProject(projectName);
});

Given('user is at {string} page', () => {
  naviagteTo(menu.Add);
});

When('user clicks From Git card on the +Add page', () => {
  seelctCardFromOptions(addOptions.Git);
});

Then('user navigates to page with header name Import from git', () => {
  gitPage.verifyTitle('Import from git');
});

Then('pipeline section is displayed with message {string}', (message) => {
  gitPage.verifyPipelinesSection(message);
});

Given('user is at {string} form', (title) => {
  gitPage.verifyTitle(title);
});

When('user type Git Repo url as {string}', (gitUrl) => {
  gitPage.enterGitUrl(gitUrl);
});

Then('Add pipeline checkbox is displayed', () => {
  gitPage.verifyPipelineCheckBox();
});

When('type Name as {string} in General section', (name) => {
  gitPage.enterAppName(name);
});

When('select {string} radio button in Resources section', (resoruce) => {
  gitPage.selectResource(resoruce);
});

When('select Add Pipeline checkbox in Pipelines section', () => {
  gitPage.selectAddPipeline();
});

When('click Create button on Add page', () => {
  gitPage.createWorkload();
});

Then('user redirects to topology page', () => {
  gitPage.verifyTopologyPage();
});

Then('created workload {string} is present in topology page', (name) => {
  gitPage.verifyWorkloadInTopologyPage(name);
});
