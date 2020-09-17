import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage } from '../../pages/topology-page';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';

Given('user is at the Topolgy page', () => {
  naviagteTo(devNavigationMenu.Topology);
  topologyPage.verifyTopologyPage();
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
