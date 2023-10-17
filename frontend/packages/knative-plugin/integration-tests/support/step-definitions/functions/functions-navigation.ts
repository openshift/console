import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants';
import {
  createGitWorkloadIfNotExistsOnTopologyPage,
  navigateTo,
  perspective,
} from '@console/dev-console/integration-tests/support/pages';
import { functionsPage } from '../../pages/functions/functions-page';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
});

When('user clicks on the Functions tab', () => {
  navigateTo(devNavigationMenu.Functions);
});

Then('user redirected to Functions page', () => {
  detailsPage.titleShouldContain('Functions');
});

Then('user is able to see the message {string}', (noFunctionsFound: string) => {
  functionsPage.verifyMessage(noFunctionsFound);
});

Given(
  'user has created a serverless function using repo {string} with name {string}',
  (gitRepo: string, name: string) => {
    createGitWorkloadIfNotExistsOnTopologyPage(
      gitRepo,
      name,
      'Serverless Function',
      `${name}-app`,
      false,
      true,
    );
  },
);

Then('user will see the serverless functions listed', () => {
  functionsPage.verifyFunctionsListed();
});

When('user clicks on the function name {string}', (functionName: string) => {
  functionsPage.search(functionName);
  functionsPage.clickFunctionName(functionName);
});

Then('user will see the Details page opened', () => {
  functionsPage.verifyTitle();
});

Then('user is able to see service URL and Revisions details', () => {
  functionsPage.verifyServiceURL();
  functionsPage.verifyServiceRevision();
});

Then('user is able to see Containers sections', () => {
  functionsPage.verifyContainerSection();
});

Then('user is able to see Revisions, Routes and Pods tabs', () => {
  functionsPage.verifyRevisionsTab();
  functionsPage.verifyRoutesTab();
  functionsPage.verifyPodsTab();
});

Then('user will see Getting started resources', () => {
  functionsPage.verifyGettingStarted();
});

Then('user will see Create functions using Samples', () => {
  cy.exec(`oc apply -f support/testData/serverless-functions-samples.yaml`);
  cy.byTestID('card samples').should('be.visible');
});

Then('user will see create with guided documentation', () => {
  cy.byTestID('card quick-start').should('be.visible');
});

Then('user will see Explore serverless functions', () => {
  cy.byTestID('card serverless-features').should('be.visible');
});

Then(
  'user is able to see the Create function drop down menu with Import from Git and Samples options',
  () => {
    functionsPage.verifyFunctionsActionsDropdown();
    functionsPage.clickFunctionsActionButton();
    functionsPage.verifyActionsInCreateMenu();
  },
);
