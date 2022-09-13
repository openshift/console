import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { listPage } from '@console/cypress-integration-tests/views/list-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import * as yamlView from '@console/cypress-integration-tests/views/yaml-editor';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import {
  navigateTo,
  createGitWorkloadIfNotExistsOnTopologyPage,
  topologyHelper,
  app,
} from '@console/dev-console/integration-tests/support/pages';

const deteleResourceQuota = () => {
  detailsPage.isLoaded();
  detailsPage.clickPageActionFromDropdown('Delete ResourceQuota');
  modal.shouldBeOpened();
  modal.submit();
  modal.shouldBeClosed();
};

Given('user has created workload with resource type deployment', () => {
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    'ex-node-js',
    'deployment',
    'nodejs-ex-git-app',
  );
  topologyHelper.verifyWorkloadInTopologyPage('ex-node-js');
});

Given('user has created two resource quotas using {string} file', (yamlLocation) => {
  cy.exec(`oc apply -f ${yamlLocation} -n ${Cypress.env('NAMESPACE')}`);
  app.waitForDocumentLoad();
});

When('user navigates to Add page', () => {
  app.waitForDocumentLoad();
  navigateTo(devNavigationMenu.Add);
});

When('user clicks on link to view resource quota details', () => {
  cy.byTestID('resource-quota-warning').click();
});

Then('user is redirected to resource quota details page', () => {
  cy.get('h2').should('contain.text', 'ResourceQuota details');
  deteleResourceQuota();
});

Then('user is redirected to resource quota list page', () => {
  listPage.rows.shouldBeLoaded();
});

When(
  'user creates resource quota {string} by entering {string} file data',
  (resourceQuotaName: string, yamlLocation: string) => {
    cy.get('[data-test="import-yaml"]').click();
    cy.get('.yaml-editor').should('be.visible');
    cy.readFile(yamlLocation).then((str) => {
      const myArray = str.split('---');
      resourceQuotaName === 'resourcequota1'
        ? yamlView.setEditorContent(myArray[0])
        : yamlView.setEditorContent(myArray[1]);
    });
    cy.get('[data-test="save-changes"]').click();
    cy.get('h2').should('contain.text', 'ResourceQuota details');
  },
);
