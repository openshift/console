import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { addOptions } from '@console/dev-console/integration-tests/support/constants';
import {
  addPage,
  devFilePage,
  gitPage,
  topologyPage,
} from '@console/dev-console/integration-tests/support/pages';

Given('user is at Import from Git form', () => {
  addPage.selectCardFromOptions(addOptions.ImportFromGit);
});

When('user enters Git Repo URL as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  devFilePage.verifyValidatedMessage(gitUrl);
});

When('user enters Application name as {string}', (appName: string) => {
  gitPage.enterAppName(appName);
});

When('user enters Name as {string}', (name: string) => {
  gitPage.enterComponentName(name);
});

When('user selects Build option as {string} in Build section', (buildOption: string) => {
  gitPage.selectBuildOption(buildOption);
});

When('user selects {string} as Cluster Build Strategy', (clusterBuildStrategy: string) => {
  gitPage.selectClusterBuildStrategy(clusterBuildStrategy);
});

When('user selects resource type as {string}', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

When('user clicks Create button on Add page', () => {
  gitPage.clickCreate();
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('user can see toast notification saying {string} created successfully', (message: string) => {
  gitPage.notificationVerify(message);
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});
