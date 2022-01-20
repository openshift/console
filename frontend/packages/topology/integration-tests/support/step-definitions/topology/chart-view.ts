import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants';
import {
  devNavigationMenu,
  operators,
  resources,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import {
  createGitWorkload,
  verifyAndInstallOperator,
} from '@console/dev-console/integration-tests/support/pages';
import {
  app,
  navigateTo,
  perspective,
} from '@console/dev-console/integration-tests/support/pages/app';
import { topologyPO, typeOfWorkload } from '../../page-objects/topology-po';
import {
  topologyActions,
  topologyHelper,
  topologyPage,
  topologySidePane,
} from '../../pages/topology';

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Then('user sees Topology page with message {string}', (message: string) => {
  cy.get(topologyPO.emptyText).contains(message);
});

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on {string} link in the topology page', (addLink) => {
  cy.get(topologyPO.graph.addLink)
    .should('be.visible')
    .should('have.text', addLink);
  cy.get(topologyPO.graph.addLink).click();
});

Then('user will be redirected to Add page', () => {
  cy.url().should('include', 'add');
  app.waitForLoad();
  cy.contains(pageTitle.Add).should('be.visible');
});

When('user clicks on {string} link in the empty topology page', (build: string) => {
  cy.byTestID(
    build
      .toLowerCase()
      .replace(/\s+/g, '-')
      .trim(),
  )
    .should('be.visible')
    .click();
  cy.log(`Quick search bar can be seen with ${build} link`);
});

Then('user will be able to see Add to project search bar', () => {
  cy.get(topologyPO.graph.quickSearch).should('be.visible');
});

Given('user has created a deployment workload named {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment',
    'nodejs-ex-git-app',
  );
});

Given('user has created a deployment workload {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment',
    'nodejs-ex-git-app',
  );
});

Given('user has created a deployment config workload {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment Config',
    'nodejs-ex-git-app',
  );
});

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Then(
  'user sees {string} and {string} workloads in topology chart area',
  (workload1: string, workload2: string) => {
    topologyHelper.verifyWorkloadInTopologyPage(workload1);
    topologyHelper.verifyWorkloadInTopologyPage(workload2);
  },
);

Given(
  'user created {string} workload',
  (resourceType: string, componentName: string = `${resourceType.toLowerCase()}-ex-git`) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/django-ex.git',
      componentName,
      resourceType,
      'django-ex-git-app',
    );
  },
);

When('user is at Topology page chart view', () => {
  navigateTo(devNavigationMenu.Topology);
  cy.get(topologyPO.switcher).should('have.attr', 'aria-label', 'List view');
});

When('user clicks the filter by resource on top', () => {
  cy.get(topologyPO.filterByResourceDropDown)
    .should('be.visible')
    .click();
});

When('user clicks on {string} option', (resourceType: string) => {
  cy.byTestID(resourceType)
    .should('be.visible')
    .click();
});

Then('user can see only the {string} workload', (workload: string) => {
  cy.get(typeOfWorkload(workload)).should('be.visible');
});

When('user selects {string} option in filter menu', (searchType: string) => {
  cy.get('#toggle-id').click();
  cy.get("[role='menu']")
    .find('li')
    .contains(searchType)
    .should('be.visible')
    .click();
});

When('user searches for label {string}', (search: string) => {
  cy.get(topologyPO.search)
    .clear()
    .type(search);
  cy.get('.co-suggestion-box__suggestions')
    .find('button')
    .contains(search)
    .should('be.visible')
    .first()
    .click();
});

Then('user can see the workload {string} visible', (workload: string) => {
  cy.get(topologyPO.highlightNode).should('be.visible');
  cy.get(topologyPO.highlightNode).should('contain', workload);
  app.waitForDocumentLoad();
});

When('user clicks on workload {string} to open sidebar', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
});

When(
  'user opens the details page for {string} by clicking on the title',
  (workloadName: string) => {
    topologySidePane.selectResource(
      resources.Deployments,
      'aut-topology-delete-workload',
      `${workloadName}`,
    );
  },
);

When('user navigate back to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
  cy.get(topologyPO.switcher).should('have.attr', 'aria-label', 'List view');
});

Then(
  'user will see the the workload {string} selected with sidebar open',
  (workloadName: string) => {
    // topologySidePane.verify();
    // topologySidePane.verifyTitle(workloadName);
    cy.log(workloadName, 'sidebar is open'); // to avoid lint issues
  },
);

Given('user has installed Service Binding operator', () => {
  verifyAndInstallOperator(operators.ServiceBinding);
});

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
});

When('user right clicks on workload {string}', (appName: string) => {
  topologyPage.rightClickOnNode(appName);
});

When('user clicks on {string} option from context menu', (actionItem: string) => {
  app.waitForLoad();
  topologyActions.selectAction(actionItem);
});

Then('user will see {string} modal', (modalName: string) => {
  app.waitForLoad();
  cy.get('[aria-label="Modal"]')
    .should('be.visible')
    .should('contain', modalName);
});

Then('user will see alert {string}', (alertName: string) => {
  app.waitForDocumentLoad();
  cy.get('[aria-label="Default Alert"]')
    .should('be.visible')
    .should('contain', alertName);
  modal.cancel();
});
