import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add-flow/add-page';
import { topologyPage } from '../../pages/topology-page';
import { addOptions } from '../../constants/add';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';

Given("user is at Add page", () => {
  naviagteTo(devNavigationMenu.Add);
});

Given(
  'user created workload {string} with resource type {string}',
  (componentName: string, resourceType: string = 'Deployment') => {
    addPage.createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceType,
      'nodejs-ex-git-app',
    );
    topologyPage.verifyWorkloadInTopologyPage(componentName);
  },
);

Given("user is at Developer Catlog page", () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When("user navigates to Add page", () => {
  naviagteTo(devNavigationMenu.Add);
});

When("user clicks Create button on Add page", () => {
  addPage.clickCreate();
});

Then("user will be redirected to Add page", () => {
  cy.get("h1.ocs-page-layout__title").should("have.text", "Add");
});
