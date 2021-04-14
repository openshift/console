import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { topologySidePane } from '@console/topology/integration-tests/support/pages/topology/topology-side-pane-page';

Given('user has scaled up the pod to 2 for workload {string}', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
  topologySidePane.selectTab('Details');
  topologySidePane.scaleUpPodCount();
});

When('user scales up the pod', () => {
  topologySidePane.scaleUpPodCount();
});

When('user scales down the pod number', () => {
  topologySidePane.scaleDownPodCount();
});

Then(
  'user is able to see pod Scaling to {string} for workload {string}',
  (podText: string, workloadName: string) => {
    topologySidePane.close();
    topologyPage.componentNode(workloadName).click({ force: true });
    topologySidePane.selectTab('Details');
    topologySidePane.verifyPodText(podText);
  },
);
