import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { listPage } from '@console/cypress-integration-tests/views/list-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import {
  navigateTo,
  yamlEditor,
  createGitWorkloadIfNotExistsOnTopologyPage,
  topologyHelper,
  gitPage,
  devFilePage,
  topologyPage,
} from '@console/dev-console/integration-tests/support/pages';
import * as yamlView from '../../../../../integration-tests-cypress/views/yaml-editor';
import { topologyPO } from '../../page-objects/topology-po';

const deteleResourceQuota = (resourceQuotaName: string) => {
  listPage.filter.byName(resourceQuotaName);
  listPage.rows.clickRowByName(resourceQuotaName);
  detailsPage.isLoaded();
  detailsPage.clickPageActionFromDropdown('Delete ResourceQuota');
  modal.shouldBeOpened();
  modal.submit();
  modal.shouldBeClosed();
};

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Given('user is at the Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user right clicks on topology empty graph', () => {
  cy.get(topologyPO.graph.emptyGraph).rightclick(1, 1);
});

When('user selects {string} option from Add to Project context menu', (option: string) => {
  cy.get(topologyPO.graph.contextMenuOptions.addToProject)
    .focus()
    .trigger('mouseover');
  cy.byTestActionID(option).click({ force: true });
});

Given('user has created workload with resource type deployment', () => {
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    'ex-node-js',
    'deployment',
    'nodejs-ex-git-app',
  );
  topologyHelper.verifyWorkloadInTopologyPage('ex-node-js');
});

When('user enters Git Repo URL as {string} in Import from Git form', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  devFilePage.verifyValidatedMessage(gitUrl);
});

When('user enters workload name as {string}', (name: string) => {
  gitPage.enterWorkloadName(name);
});

When('user clicks Create button on Add page', () => {
  gitPage.clickCreate();
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

Given('user clicks on import YAML button', () => {
  cy.get('[data-test="import-yaml"]').click();
  cy.get('.yaml-editor').should('be.visible');
});

When('user clicks on Create button', () => {
  cy.get('[data-test="save-changes"]').click();
});

When('user enters the {string} file data to YAML Editor', (yamlFile: string) => {
  yamlEditor.isLoaded();
  yamlEditor.clearYAMLEditor();
  yamlEditor.setEditorContent(yamlFile);
});

When('user clicks on link to view resource quota details', () => {
  cy.byTestID('resource-quota-warning').click();
});

Then('user is redirected to resource quota details page', () => {
  cy.get('h2').should('contain.text', 'ResourceQuota details');
});

Then('user is redirected to resource quota list page', () => {
  listPage.rows.shouldBeLoaded();
});

When('user deletes resource quotas created', () => {
  deteleResourceQuota('resourcequota1');
  deteleResourceQuota('resourcequota2');
});

When('user clicks on Delete application', () => {
  cy.get('.odc-topology-context-menu')
    .contains('Delete application')
    .click();
});

When(
  'user enters the name {string} in the Delete application modal and clicks on Delete button',
  (appName: string) => {
    topologyPage.deleteApplication(appName);
  },
);

When('user right clicks on Application Grouping {string}', (appName: string) => {
  topologyPage.rightClickOnApplicationGroupings(appName);
});

When(
  'user creates resource quota {string} by entering {string} file data',
  (resourceQuotaName: string, yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      const myArray = str.split('---');
      resourceQuotaName === 'resourcequota1'
        ? yamlView.setEditorContent(myArray[0])
        : yamlView.setEditorContent(myArray[1]);
    });
  },
);

Then(
  'user should not be able to see the resource quotas {string} and {string}',
  (resourcequota1: string, resourcequota2: string) => {
    listPage.rows.shouldNotExist(resourcequota1);
    listPage.rows.shouldNotExist(resourcequota2);
  },
);
