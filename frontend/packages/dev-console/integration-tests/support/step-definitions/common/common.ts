import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { perspective, projectNameSpace, navigateTo } from '../../pages/app';
import { switchPerspective, devNavigationMenu } from '../../constants/global';
import { guidedTour } from '../../../../../integration-tests-cypress/views/guided-tour';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { pipelinesPage } from '@console/dev-console/integration-tests/support/pages/pipelines/pipelines-page';
import { pageTitle } from '../../constants';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
});

Given('user has created namespace starts with {string}', (projectName: string) => {
  const d = new Date();
  const timestamp = d.getTime();
  projectNameSpace.selectOrCreateProject(`${projectName}-${timestamp}-ns`);
  // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective display after creating or selecting project');
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  navigateTo(devNavigationMenu.Add);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

Given('user is at Monitoring page', () => {
  navigateTo(devNavigationMenu.Monitoring);
});

Given('user is at namespace {string}', (projectName: string) => {
  projectNameSpace.selectOrCreateProject(projectName);
});

When('user switches to developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
});

When(
  'user selects {string} option from kebab menu for pipeline {string}',
  (option: string, pipelineName: string) => {
    pipelinesPage.selectKebabMenu(pipelineName);
    cy.byTestActionID(option).click();
  },
);

When('user selects {string} option from Actions menu', (option: string) => {
  cy.byTestActionID(option).click();
});

Then('modal with {string} appears', (header: string) => {
  modal.modalTitleShouldContain(header);
});

Then('user will be redirected to Pipelines page', () => {
  cy.byLegacyTestID('resource-title').should('contain.text', pageTitle.Pipelines);
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
