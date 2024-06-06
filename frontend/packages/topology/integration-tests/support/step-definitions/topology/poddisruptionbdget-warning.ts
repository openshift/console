import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { listPage } from '@console/cypress-integration-tests/views/list-page';
import * as yamlView from '@console/cypress-integration-tests/views/yaml-editor';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import {
  navigateTo,
  topologyPage,
  app,
  createGitWorkloadIfNotExistsOnTopologyPage,
  topologyHelper,
} from '@console/dev-console/integration-tests/support/pages';

Given('user has created workload with resource type deployment', () => {
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    'nodejs-ex',
    'deployment',
    'nodejs-ex-git-app',
  );
  topologyHelper.verifyWorkloadInTopologyPage('nodejs-ex');
});

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyTopologyPage();
});

When('user clicks on link to view PodDisruptionBudget details', () => {
  cy.reload();
  app.waitForLoad();
  guidedTour.close();
  cy.byTestID('pdb-warning').click();
});

Then('user is redirected to PodDisruptionBudget details page', () => {
  cy.get('h2').should('contain.text', 'PodDisruptionBudget details');
});

Then('user is redirected to PodDisruptionBudget list page', () => {
  listPage.rows.shouldBeLoaded();
});

Then('user should not see PodDisruptionBudget warning message', () => {
  cy.byTestID('pdb-warning').should('not.exist');
});

When(
  'user creates {string} PodDisruptionBudget by entering {string} file data',
  (pdbName: string, yamlLocation: string) => {
    cy.get('[data-test="import-yaml"]').click();
    cy.get('.yaml-editor').should('be.visible');
    cy.readFile(yamlLocation).then((str) => {
      const myArray = str.split('---');
      pdbName === 'my-pdb-1'
        ? yamlView.setEditorContent(myArray[0])
        : pdbName === 'my-pdb-2'
        ? yamlView.setEditorContent(myArray[1])
        : yamlView.setEditorContent(myArray[2]);
    });
    cy.get('[data-test="save-changes"]').click();
    cy.get('h2').should('contain.text', 'PodDisruptionBudget details');
  },
);
