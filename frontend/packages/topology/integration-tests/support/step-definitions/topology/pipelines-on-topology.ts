import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { createGitWorkload } from '@console/dev-console/integration-tests/support/pages';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages/app';
import { topologyPage, topologySidePane } from '../../pages/topology';

Given(
  'user has created workload {string} with resource type {string} with pipeline',
  (componentName: string, resourceName: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceName,
      'nodejs-ex-git-app',
      true,
    );
  },
);

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on workload {string} to open sidebar', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
  topologyPage.waitForLoad();
});

Then('user can see {string} section in Resources tab', (heading: string) => {
  topologySidePane.selectTab('Resources');
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifySection(heading);
});
