import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';
import { devNavigationMenu, addOptions } from '../../constants';
import { topologyPO } from '../../pageObjects';
import { addPage, gitPage } from '../add-flow';
import { app, createForm, navigateTo } from '../app';

export const createGitWorkload = (
  gitUrl: string = 'https://github.com/sclorg/nodejs-ex.git',
  componentName: string = 'nodejs-ex-git',
  resourceType: string = 'Deployment',
  appName: string = 'nodejs-ex-git-app',
  isPipelineSelected: boolean = false,
) => {
  addPage.selectCardFromOptions(addOptions.Git);
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage();
  gitPage.enterAppName(appName);
  gitPage.enterComponentName(componentName);
  gitPage.selectResource(resourceType);
  if (isPipelineSelected === true) {
    gitPage.selectAddPipeline();
  }
  createForm.clickCreate().then(() => {
    app.waitForLoad();
    cy.log(`Workload "${componentName}" with resource type "${resourceType}" is created`);
  });
};

export const createGitWorkloadIfNotExistsOnTopologyPage = (
  gitUrl: string = 'https://github.com/sclorg/nodejs-ex.git',
  componentName: string = 'nodejs-ex-git',
  resourceType: string = 'Deployment',
) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.waitForLoad();
  cy.get('body').then(($body) => {
    if ($body.find(topologyPO.emptyStateIcon).length) {
      cy.log(`Topology doesn't have workload "${componentName}", lets create it`);
      navigateTo(devNavigationMenu.Add);
      createGitWorkload(gitUrl, componentName, resourceType);
      topologyPage.verifyWorkloadInTopologyPage(componentName);
    } else {
      topologyPage.search(componentName);
      cy.get('body').then(($node) => {
        if ($node.find(topologyPO.highlightNode).length) {
          cy.log(`knative service: ${componentName} is already created`);
        } else {
          navigateTo(devNavigationMenu.Add);
          createGitWorkload(gitUrl, componentName, resourceType);
          topologyPage.verifyWorkloadInTopologyPage(componentName);
        }
      });
    }
  });
};
