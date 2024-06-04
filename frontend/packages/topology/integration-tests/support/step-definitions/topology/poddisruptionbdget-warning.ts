import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { listPage } from '@console/cypress-integration-tests/views/list-page';
import * as yamlView from '@console/cypress-integration-tests/views/yaml-editor';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import {
  navigateTo,
  topologyPage,
  app,
} from '@console/dev-console/integration-tests/support/pages';

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

Given('user creates PodDisruptionBudget by entering {string} file data', (yamlLocation: string) => {
  cy.get('[data-test="import-yaml"]').click();
  cy.get('.yaml-editor').should('be.visible');
  cy.readFile(yamlLocation).then((str) => {
    yamlView.setEditorContent(str);
  });
  cy.get('[data-test="save-changes"]').click();
});
