import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage } from '../../pages/topology/topology-page';
import { app, navigateTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';
import { topologySidePane } from '../../pages/topology/topology-side-pane-page';

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyTopologyPage();
});

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Then('user is able to see workload {string} in topology page list view', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

When('user clicks on workload {string}', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
});

Then('user can see sidebar opens with Resources tab selected by default', () => {
  topologySidePane.verifySelectedTab('Resources');
});

Then('side bar is displayed with the pipelines section', () => {
  topologySidePane.verifyTab('Resources');
  app.waitForLoad();
  topologySidePane.verifySection('Pipeline Runs');
});
