import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { perspective, projectNameSpace as project, naviagteTo } from '../../pages/app';
import { operatorsPage } from '../../pages/operators_page';
import {switchPerspective, devNavigationMenu as menu, devNavigationMenu} from '../../constants/global';
import { pipelineBuilderPage} from '../../pages/pipelineBuilder_page';
import  {pipelineRunDetailsPage} from '../../pages/pipelineRunDetails_page';
import { pipelinesPage } from '../../pages/pipelines_page';
import { topologyPage } from '../../pages/topology_page';
import { seelctCardFromOptions } from '../../pages/add_page';
import { addOptions } from '../../constants/add';

// Given('user logged into the openshift application', () => {
//     loginPage.loginWithValidCredentials(Cypress.env('username'), Cypress.env('password'));
//     loginPage.checkLoginSuccess();
// });

// { tags:"@smoke" },
// Before({ tags:"@smoke" },() => {
//   loginPage.loginWithValidCredentials(Cypress.env('username'), Cypress.env('password'));
//     loginPage.checkLoginSuccess();
// });
  
Given('user is at admin perspecitve', () => {
  perspective.verifyPerspective('Administrator');
});

Given('user is in administratr perspective', () => {
  perspective.verifyPerspective('Administrator');
});

Given('user is at dev perspecitve', () => {
  perspective.switchTo(switchPerspective.Developer);
  perspective.verifyPerspective('Developer');
});

Given('user is at developer perspecitve', () => {
  perspective.switchTo(switchPerspective.Developer);
  perspective.verifyPerspective('Developer');
});

Given('open shift cluster is installed with Serverless operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.verifyOperatorInNavigationMenu('Serverless');
});

Given('open shift cluster is installed with Serverless and eventing operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.verifyOperatorInNavigationMenu('Serverless');
});

Given('user is on dev perspective +Add page', () => {
  perspective.switchTo(switchPerspective.Developer);
  naviagteTo(devNavigationMenu.Add);
});

Given('openshift cluster is installed with pipeline operator', () => {
    perspective.switchTo(switchPerspective.Developer);
    perspective.verifyPerspective('Developer');
    cy.get('#page-sidebar').then(($navMenu) => {
      if ($navMenu.find('[data-test-id="pipeline-header"]').length) {
        cy.log('pipeline operator is installed');
      }
    })
});

Given('user is at the project namespace {string} in dev perspecitve', (projectName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  project.selectProject(projectName);
});
  
Given('openshift cluster is installed with knative operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  perspective.verifyPerspective('Administrator');
  cy.wait(5000);
  operatorsPage.verifyOperatorInNavigationMenu('Serverless');
});

Given('open project namespace {string}', (namespace: string) => {
  project.selectProject(namespace);
});

Given('user is at Add page', () => {
  naviagteTo(devNavigationMenu.Add);
});

Given('user is at Topology page', () => {
  naviagteTo(menu.Topology);
  topologyPage.verifyTopologyPage();
});

Given('user is at the topolgy page', () => {
  naviagteTo(menu.Topology);
  topologyPage.verifyTopologyPage();
});

Given('user is at Developer Catlog page', () => {
  seelctCardFromOptions(addOptions.Catalog);
});

Given('user is at pipelines page', () => {
  naviagteTo(menu.Pipelines);
});

Given('user is at pipeline Runs page', () => {
  pipelineRunDetailsPage.verifyTitle();
});

When('user switches to developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
});

When('user navigates to Topology page', () => {
  naviagteTo(devNavigationMenu.Topology);
});

When('user navigates to Add page', () => {
  naviagteTo(devNavigationMenu.Add);
});

When('user selects {string} option from kebab menu', (option: string) => {
  cy.byTestActionID(option).click();
});

When('user selects {string} option from kebab menu for pipeline {string}', (option: string, pipelineName: string) => {
  naviagteTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID(option).click();
});

When('user selects {string} option from Actions menu', (option: string) => {
  cy.byTestActionID(option).click();
})

Then('popup displays with header name {string}', (header: string) => {
  cy.alertTitleShouldBe(header);
});

Then('user is at the Pipeline Builder page', () => {
  pipelineBuilderPage.verifyTitle();
});

Then('user redirects to Pipeline Run Details page', () => {
  pipelineRunDetailsPage.verifyTitle();
});

Then('user redirects to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('user redirects to Add page', () => {
  cy.titleShouldBe('Add');
});

Then('user redirects to Pipelines page', () => {
  cy.titleShouldBe('Pipelines');
});