import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { perspective, projectNameSpace, navigateTo } from '../../pages/app';
import { switchPerspective, devNavigationMenu } from '../../constants/global';
import { guidedTour } from '../../../../../integration-tests-cypress/views/guided-tour';
import { nav } from '../../../../../integration-tests-cypress/views/nav';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { adminNavigationMenu, perspectiveName } from '../../constants/staticText/global-text';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  // Bug: 1890676 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective with guider tour modal');
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(perspectiveName.developer);
  // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective');
});

Given('user has created namespace starts with {string}', (projectName: string) => {
  const d = new Date();
  const timestamp = d.getTime();
  projectNameSpace.selectOrCreateProject(`${projectName}-${timestamp}-ns`);
  // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective display after creating or selecting project');
  cy.log(`User has selected namespace "${projectName}-${timestamp}-ns"`);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
  cy.log(`User has selected namespace "${projectName}"`);
});

Given('user is at Monitoring page', () => {
  navigateTo(devNavigationMenu.Monitoring);
});

Given('user is at namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(projectName);
});

When('user switches to developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
});

When('user selects {string} option from Actions menu', (option: string) => {
  cy.byTestActionID(option).click();
});

Then('modal with {string} appears', (header: string) => {
  modal.modalTitleShouldContain(header);
});

Then('user will be redirected to Pipelines page', () => {
  detailsPage.titleShouldContain(adminNavigationMenu.pipelines);
});

When('user clicks create button', () => {
  cy.get('button[type="submit"]').click();
});

Given('user has selected namespace {string}', (projectName: string) => {
  projectNameSpace.selectProject(projectName);
  cy.log(`User has selected namespace ${projectName}`);
});

When('user clicks on {string} link', (buttonName: string) => {
  cy.byButtonText(buttonName).click();
});

When('user is at namespace {string}', (projectName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  projectNameSpace.selectOrCreateProject(projectName);
});
