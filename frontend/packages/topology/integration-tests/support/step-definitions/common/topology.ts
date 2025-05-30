import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { nav } from '@console/cypress-integration-tests/views/nav';
import {
  switchPerspective,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants/global';
import {
  createGitWorkload,
  gitPage,
  installKnativeOperatorUsingCLI,
  topologyHelper,
} from '@console/dev-console/integration-tests/support/pages';
import {
  perspective,
  projectNameSpace,
  navigateTo,
  createForm,
} from '@console/dev-console/integration-tests/support/pages/app';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';
import {
  verifyAndInstallGitopsPrimerOperator,
  verifyAndInstallPipelinesOperator,
} from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { topologySidePane } from '@console/topology/integration-tests/support/pages/topology/topology-side-pane-page';

Given('user is at administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyTopologyPage();
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyTopologyPage();
});

Given('user is at Topology page in the admin view', () => {
  cy.get('[data-quickstart-id="qs-nav-workloads"]').should('be.visible').click({ force: true });
  cy.byLegacyTestID('topology-header').should('be.visible').click({ force: true });
  topologyPage.verifyTopologyPage();
});

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user navigates to Topology page in admin view', () => {
  cy.byLegacyTestID('topology-header').should('exist').click({ force: true });
});

Then('user is able to see workload {string} in topology page list view', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.waitForLoad();
  topologyPage.verifyToplogyPageNotEmpty();
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage(5);
});

When('user clicks on workload {string}', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
});

When('user opens the sidebar for {string}', (workloadName: string) => {
  topologyPage.verifyOrOpenSidebar(workloadName);
});

Then('user can see sidebar opens with Resources tab selected by default', () => {
  topologySidePane.verifySelectedTab('Resources');
});

Then('side bar is displayed with the pipelines section', () => {
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifySection('Pipeline Runs');
});

Then('user can see sidebar Details, Resources and Observe tabs', () => {
  topologySidePane.verifyTab('Details');
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifyTab('Observe');
});

Then('user can see sidebar Details, Resources tabs', () => {
  topologySidePane.verifyTab('Details');
  topologySidePane.verifyTab('Resources');
});

When('user goes to Details tab', () => {
  topologySidePane.selectTab('Details');
});

Then('user can see close button', () => {
  topologySidePane.close();
});

Then(
  'user verifies name of the node {string} and Action drop down present on top of the sidebar',
  (nodeName: string) => {
    topologySidePane.verifyTitle(nodeName);
    topologySidePane.verifyActionsDropDown();
  },
);

Then('user is able to see health check notification', () => {
  topologySidePane.verifyHealthCheckAlert();
});

Given('user is at developer perspective', () => {
  checkDeveloperPerspective();
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
});

Given('user has created namespace starts with {string}', (projectName: string) => {
  const d = new Date();
  const timestamp = d.getTime();
  projectNameSpace.selectOrCreateProject(`${projectName}-${timestamp}-ns`);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
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
    topologyHelper.verifyWorkloadInTopologyPage(componentName);
  },
);

Given(
  'user has created workload {string} with resource type {string} and application groupings {string}',
  (componentName: string, resourceType: string = 'Deployment', applicationGroupings: string) => {
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceType,
      applicationGroupings,
    );
    topologyPage.verifyWorkloadInTopologyPage(componentName);
  },
);

Given('user is at Add page', () => {
  checkDeveloperPerspective();
  navigateTo(devNavigationMenu.Add);
});

When(
  'user right clicks on the workload {string} to open the Context Menu',
  (workloadName: string) => {
    topologyPage.rightClickOnNode(workloadName);
  },
);

Then('user will see workload disappeared from topology', () => {
  navigateTo(devNavigationMenu.Add);
  navigateTo(devNavigationMenu.Topology);
  cy.get(topologyPO.emptyStateIcon).should('be.visible');
});

Then('user will see workload disappeared from topology in admin view', () => {
  cy.byLegacyTestID('developer-catalog-header').should('exist').click({ force: true });
  cy.byLegacyTestID('topology-header').should('exist').click({ force: true });
  cy.get(topologyPO.emptyStateIcon).should('be.visible');
});

Given('user has installed OpenShift Serverless Operator', () => {
  installKnativeOperatorUsingCLI();
});

Given('user is at Topology Graph view', () => {
  topologyPage.verifyTopologyGraphView();
});

When('user clicks Start building your application', () => {
  cy.get(topologyPO.emptyView.startBuildingYourApplicationLink).click();
});

When('user enters {string} builder image in Quick Search bar', (searchItem: string) => {
  cy.get(topologyPO.quickSearch).type(searchItem);
  cy.byTestID('item-name-.NET-Builder Images').first().click();
});

When('user clicks Create application on Quick Search Dialog', () => {
  cy.get('[class*="spinner"]').should('not.exist');
  cy.get('ul[aria-label="Quick search list"] li')
    .contains('Builder Images', { timeout: 60000 })
    .click();
  cy.get('button').contains('Create').click();
});

When(
  'user enters Git Repo URL as {string} in Create Source-to-Image Application',
  (gitUrl: string) => {
    gitPage.enterGitUrl(gitUrl);
    cy.get('#form-input-git-url-field-helper').should('include.text', 'Validated');
  },
);

When('user clicks Create button on Create Source-to-Image Application page', () => {
  createForm.clickCreate();
});

When('user enters Application Name as {string}', (appName: string) => {
  gitPage.enterAppName(appName);
});

When('user enters Name as {string}', (name: string) => {
  gitPage.enterWorkloadName(name);
});

When('user selects {string} in Resource type section', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

Given('user has installed Gitops primer Operator', () => {
  verifyAndInstallGitopsPrimerOperator();
});

Given('user has installed OpenShift Pipelines Operator', () => {
  verifyAndInstallPipelinesOperator();
});

When('user selects Resource as deployment', () => {
  cy.byTestID('kubernetes-view-input').click();
});
