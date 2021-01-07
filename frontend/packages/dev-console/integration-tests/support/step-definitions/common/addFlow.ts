import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { gitPage } from '../../pages/add-flow/git-page';
import { naviagteTo } from '../../pages/app';
import { addPage } from '../../pages/add-flow/add-page';
import { topologyPage } from '../../pages/topology/topology-page';
import { addOptions } from '../../constants/add';
import { createGitWorkload } from '../../pages/functions/createGitWorkload';
import { devNavigationMenu } from '../../constants/global';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { pageTitle } from '../../constants/pageTitle';

Given('user is at Add page', () => {
  naviagteTo(devNavigationMenu.Add);
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

Given('user is at the developer catalog page', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('user navigates to Add page', () => {
  naviagteTo(devNavigationMenu.Add);
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

Then('user can see {string} card on the Add page', (cardName: string) => {
  addPage.verifyCard(cardName);
});

When('user selects {string} card from add page', (cardName: string) => {
  addPage.selectCardFromOptions(cardName);
});
