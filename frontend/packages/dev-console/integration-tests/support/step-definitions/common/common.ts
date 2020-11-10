import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { perspective, projectNameSpace, naviagteTo } from '../../pages/app';
import { switchPerspective, devNavigationMenu } from '../../constants/global';
import { guidedTour } from '../../../../../integration-tests-cypress/views/guided-tour';
import { nav } from '../../../../../integration-tests-cypress/views/nav';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  // Bug: 1890676 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective with guider tour modal');
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText('Developer');
  // Bug: 1890678 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective');
});

Given('user has created namespace starts with {string}', (projectName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  const d = new Date();
  const timestamp = d.getTime();
  projectNameSpace.selectOrCreateProject(`${projectName}-${timestamp}-ns`);
  // Bug: 1890678 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective display after creating or selecting project');
  cy.log(`User has selected namespace "${projectName}-${timestamp}-ns"`);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  projectNameSpace.selectOrCreateProject(`${projectName}`);
  cy.log(`User has selected namespace "${projectName}"`);
});

Given('user is at pipelines page', () => {
  naviagteTo(devNavigationMenu.Pipelines);
});

Given('user is at Monitoring page', () => {
  naviagteTo(devNavigationMenu.Monitoring);
});

Given('user is at namespace {string}', (projectName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  projectNameSpace.selectOrCreateProject(projectName);
});

When('user switches to developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
});

When('user selects {string} option from kebab menu', (option: string) => {
  cy.byTestActionID(option).click();
});

When('user selects {string} option from Actions menu', (option: string) => {
  cy.byTestActionID(option).click();
});

Then('modal with {string} appears', (header: string) => {
  modal.modalTitleShouldContain(header);
});

Then('user will be redirected to Pipelines page', () => {
  detailsPage.titleShouldContain('Pipelines');
});

When('user clicks create button', () => {
  cy.get('button[type="submit"]').click();
});
