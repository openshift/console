import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyHelper } from '@console/dev-console/integration-tests/support/pages';
import { addToApplication } from '@console/topology/integration-tests/support/pages/topology/topology-actions-page';
import {
  topologyPage,
  addGitWorkload,
} from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { topologySidePane } from '@console/topology/integration-tests/support/pages/topology/topology-side-pane-page';

When('user right clicks on Application {string} to open Context Menu', (appName: string) => {
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

Then('user can view Add to Application and Delete Application options', () => {
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
