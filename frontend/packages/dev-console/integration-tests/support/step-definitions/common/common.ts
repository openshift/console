import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { switchPerspective, devNavigationMenu, adminNavigationMenu } from '../../constants';
import { perspective, projectNameSpace, navigateTo, app } from '../../pages';
import { checkDeveloperPerspective } from '../../pages/functions/checkDeveloperPerspective';

Given('user has logged in as a basic user', () => {
  cy.logout();
  const idp = Cypress.expose('BRIDGE_HTPASSWD_IDP') || 'test';
  const username = Cypress.expose('BRIDGE_HTPASSWD_USERNAME') || 'test';
  cy.env(['BRIDGE_HTPASSWD_PASSWORD']).then(({ BRIDGE_HTPASSWD_PASSWORD }) => {
    cy.login(idp, username, BRIDGE_HTPASSWD_PASSWORD || 'test');
  });
  app.waitForLoad();
});

Given('user is at developer perspective', () => {
  checkDeveloperPerspective();
  app.waitForLoad();
});

Given('user has only admin perspective enabled', () => {
  cy.exec(
    `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Disabled"}}]}}}'`,
    { failOnNonZeroExit: true },
  ).then((result) => {
    cy.log(result.stdout);
    cy.log(result.stderr);
  });
  cy.exec(`  oc rollout status -w deploy/console -n openshift-console`, {
    failOnNonZeroExit: true,
  }).then((result) => {
    cy.log(result.stderr);
  });
});

Given('user has created namespace starts with {string}', (projectName: string) => {
  const d = new Date();
  const timestamp = d.getTime();
  projectNameSpace.selectOrCreateProject(`${projectName}-${timestamp}-ns`);
  cy.testA11y('Developer perspective display after creating or selecting project');
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.expose('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given('user is at Monitoring page', () => {
  navigateTo(devNavigationMenu.Observe);
});

Given('user is at namespace {string}', (projectName: string) => {
  Cypress.expose('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(projectName);
});

When('user switches to developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
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
});

When('user clicks on {string} link', (buttonName: string) => {
  cy.byButtonText(buttonName).click();
});

When('user is at namespace {string}', (projectName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  projectNameSpace.selectOrCreateProject(projectName);
});

When('user refreshes the page', () => {
  cy.reload();
});
