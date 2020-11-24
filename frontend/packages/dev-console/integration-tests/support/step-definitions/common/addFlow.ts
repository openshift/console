import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { gitPage } from '../../pages/add-flow/git-page';
import { navigateTo } from '../../pages/app';
import { addPage } from '../../pages/add-flow/add-page';
import { topologyPage } from '../../pages/topology/topology-page';
import { addOptions } from '../../constants/add';
import { createGitWorkload } from '../../pages/functions/createGitWorkload';
import { devNavigationMenu } from '../../constants/global';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { pageTitle } from '../../constants/pageTitle';
import { topologyPO } from '../../pageObjects/topology-po';

Given('user is at Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

Given(
  'user has created workload {string} with resource type {string}',
  (componentName: string, resourceType: string = 'Deployment') => {
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceType,
      'nodejs-ex-git-app',
    );
    topologyPage.verifyWorkloadInTopologyPage(componentName);
  },
);

Given('user has opened application {string} in topology page', (componentName: string) => {
  cy.get('body').then(($body) => {
    if ($body.find(topologyPO.graph.workload).length > 0) {
      topologyPage.verifyWorkloadInTopologyPage(componentName);
      topologyPage.clickWorkloadUrl(componentName);
    } else {
      createGitWorkload(
        'https://github.com/sclorg/nodejs-ex.git',
        componentName,
        'Deployment',
        'dancer-ex-git-app',
      );
    }
  });

  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment',
    'nodejs-ex-git-app',
  );
  topologyPage.verifyWorkloadInTopologyPage(componentName);
});

Given('user is at Developer Catlog page', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('user navigates to Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user clicks Create button on Add page', () => {
  gitPage.clickCreate();
});

Then('user will be redirected to Add page', () => {
  detailsPage.titleShouldContain(pageTitle.Add);
});

When('user clicks Cancel button on Add page', () => {
  gitPage.clickCancel();
});
