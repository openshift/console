import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { switchPerspective, devNavigationMenu, adminNavigationMenu } from '../../constants';
import { perspective, projectNameSpace, navigateTo } from '../../pages';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  cy.testA11y('Developer perspective with guide tour modal');
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
  // Commenting below line, because it is executing on every test scenario - we will remove this in future releases
  // cy.testA11y('Developer perspective');
});

Given('user has created namespace starts with {string}', (projectName: string) => {
  const d = new Date();
  const timestamp = d.getTime();
  projectNameSpace.selectOrCreateProject(`${projectName}-${timestamp}-ns`);
  cy.testA11y('Developer perspective display after creating or selecting project');
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
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
