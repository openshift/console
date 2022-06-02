import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import {
  createGitWorkloadIfNotExistsOnTopologyPage,
  topologyHelper,
} from '@console/dev-console/integration-tests/support/pages';
import { addToApplication } from '@console/topology/integration-tests/support/pages/topology/topology-actions-page';
import {
  topologyPage,
  addGitWorkload,
  topologyListPage,
} from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { topologySidePane } from '@console/topology/integration-tests/support/pages/topology/topology-side-pane-page';
import { topologyPO } from '../../page-objects/topology-po';

When('user right clicks on application {string} to open Context Menu', (appName: string) => {
  topologyPage.rightClickOnApplicationGroupings(appName);
});

When('user clicks on application groupings {string}', (applicationGroupings: string) => {
  topologyPage.clickOnApplicationGroupings(applicationGroupings);
});

Then(
  'user is able to see workload {string} under resources tab in the sidebar',
  (workloadName: string) => {
    topologyPage.verifyApplicationGroupings(workloadName);
  },
);

Then('user can see Actions dropdown menu', () => {
  topologySidePane.verifyActionsDropDown();
});

Then('user can view Add to application and Delete application options', () => {
  topologySidePane.verifyActionsOnApplication();
});

When(
  'user fills the form with workload name {string} and clicks Create',
  (workloadName: string) => {
    addGitWorkload('https://github.com/sclorg/nodejs-ex.git', workloadName, 'Deployment');
  },
);

When('user clicks on {string}', (addOption: string) => {
  addToApplication.selectAction(addOption);
});

Then('user can see {string} workload', (workloadName: string) => {
  topologyHelper.verifyWorkloadInTopologyPage(workloadName);
});

When(
  'user enters the name {string} in the Delete application modal and clicks on Delete button',
  (appName: string) => {
    topologyPage.deleteApplication(appName);
  },
);

Then('user will not see Application groupings {string}', (appName: string) => {
  topologyPage.verifyApplicationGroupingsDeleted(appName);
});

Then(
  'user can see sidebar opens with Resources tab selected by default for application groupings',
  () => {
    topologyPage.verifyApplicationGroupingSidepane();
  },
);

When('user hovers on Add to Application from action menu', () => {
  cy.get(topologyPO.grouping.addToApplication).trigger('mouseover');
});

When('user clicks on Import From Git option', () => {
  cy.get(topologyPO.grouping.importFromGitOption).click();
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

When('user clicks on the Resources dropdown', () => {
  cy.get(topologyPO.grouping.filterResources).click();
});

Then('user sees that all the checkboxes are unchecked', () => {
  cy.get(topologyPO.grouping.deploymentCheckbox).should('not.be.checked');
});

When('user clicks on list view button', () => {
  topologyPage.verifyUserIsInGraphView();
  cy.get(topologyPO.quickSearchPO.listView).click();
});

Then(
  'user clicks on application grouping {string} in the list view',
  (applicationGrouping: string) => {
    topologyListPage.clickOnApplicationGroupings(applicationGrouping);
  },
);

Given(
  'user has created workload {string} in application grouping {string}',
  (workloadName: string, appName: string) => {
    createGitWorkloadIfNotExistsOnTopologyPage(
      'https://github.com/sclorg/nodejs-ex.git',
      workloadName,
      'deployment',
      appName,
    );
    topologyHelper.verifyWorkloadInTopologyPage('ex-node-js');
  },
);
