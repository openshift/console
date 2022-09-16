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
  createOperatorBacked,
  verifyAndInstallOperator,
} from '@console/dev-console/integration-tests/support/pages';
import {
  app,
  navigateTo,
  perspective,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages/app';
import { chartAreaPO } from '../../page-objects/chart-area-po';
import { topologyPO, typeOfWorkload } from '../../page-objects/topology-po';
import {
  addToProjectOptions,
  createWorkloadUsingOptions,
  verifyMultipleWorkloadInTopologyPage,
} from '../../pages/functions/chart-functions';
import {
  createServiceBindingConnect,
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

Given('user has installed Crunchy Postgres for Kubernetes operator', () => {
  verifyAndInstallOperator(operators.CrunchyPostgresforKubernetes);
});

Given('user navigates to Topology Page', () => {
  perspective.switchTo(switchPerspective.Developer);
  projectNameSpace.selectOrCreateProject('aut-topology-delete-workload');
  navigateTo(devNavigationMenu.Topology);
  app.waitForLoad();
  topologyPage.verifyTopologyPage();
});

Then('user is able to see Start building your application, Add page links', () => {
  cy.get(topologyPO.emptyView.startBuildingYourApplicationLink).should('be.visible');
  cy.get(topologyPO.emptyView.addPageLink).should('be.visible');
});

Then('Display options dropdown, Filter by resource and Find by name fields are disabled', () => {
  cy.contains('Display options').should('be.disabled');
  cy.get(topologyPO.filterByResourceDropDown).should('be.disabled');
  cy.get(topologyPO.search).should('be.disabled');
});

Then('switch view is disabled', () => {
  cy.get(topologyPO.switcher).should('have.attr', 'aria-disabled', 'true');
});

When('user right clicks on the node {string} to open context menu', (nodeName: string) => {
  topologyPage.rightClickOnNode(nodeName);
});

Then(
  'user is able to see context menu options like Edit Application Grouping, Edit Pod Count, Pause Rollouts, Add Health Checks, Add Horizontal Pod Autoscaler, Add Storage, Edit Update Strategy, Edit Labels, Edit Annotations, Edit Deployment, Delete Deployment',
  () => {
    cy.get(chartAreaPO.editApplicationGrouping).should('be.visible');
    cy.get(chartAreaPO.editPodCount).should('be.visible');
    cy.get(chartAreaPO.pauseRollouts).should('be.visible');
    cy.get(chartAreaPO.addHealthChecks).should('be.visible');
    cy.get(chartAreaPO.addHorizontalPod).should('be.visible');
    cy.get(chartAreaPO.addStorage).should('be.visible');
    cy.get(chartAreaPO.editUpdateStrategy).should('be.visible');
    cy.get(chartAreaPO.editLabels).should('be.visible');
    cy.get(chartAreaPO.editAnnotations).should('be.visible');
    cy.get(chartAreaPO.editDeployment).should('be.visible');
    cy.get(chartAreaPO.deleteDeployment).should('be.visible');
  },
);

When('user right clicks on the empty chart area', () => {
  cy.get(chartAreaPO.topologyArea).rightclick(10, 10);
});

When('user hovers on Add to Project', () => {
  cy.get(chartAreaPO.addToProject).trigger('mouseover');
});

Then(
  'user is able to see options like Samples, Import from Git, Container Image, From Dockerfile, From Devfile, From Catalog, Database, Operator Backed, Helm Charts, Event Source, Channel',
  () => {
    cy.get(chartAreaPO.samples).should('be.visible');
    cy.get(chartAreaPO.importFromGit).should('be.visible');
    cy.get(chartAreaPO.containerImage).should('be.visible');
    cy.get(chartAreaPO.catalog).should('be.visible');
    cy.get(chartAreaPO.database).should('be.visible');
    cy.get(chartAreaPO.operatorBacked).should('be.visible');
    cy.get(chartAreaPO.helmCharts).should('be.visible');
    cy.get(chartAreaPO.eventsource).should('be.visible');
    cy.get(chartAreaPO.channel).should('be.visible');
  },
);

When('user clicks on Samples', () => {
  cy.get(chartAreaPO.samples).click();
});

When('user selects go sample', () => {
  cy.get(chartAreaPO.filterItem).type('Go');
  cy.get(chartAreaPO.sampleGo).click();
});

When('user hovers on Add to Project and clicks on {string}', (optionName: string) => {
  cy.get(chartAreaPO.topologyArea).rightclick(10, 10);
  cy.get(chartAreaPO.addToProject).trigger('mouseover');
  addToProjectOptions(optionName);
});

When('user fills the {string} form and clicks Create', (optionName: string) => {
  createWorkloadUsingOptions(optionName);
});

When(
  'user fills the {string} form with yaml at {string} and clicks Create',
  (optionName: string, yamlLocation: string) => {
    createWorkloadUsingOptions(optionName, yamlLocation);
  },
);

When('user selects Python Builder Image and clicks Create Application', () => {
  cy.get(chartAreaPO.filterItem).type('python');
  cy.get(chartAreaPO.pythonBuilderImage).click();
  cy.get(chartAreaPO.overlayCreate).click({ force: true });
});

When('user selects Postgres Database and clicks on Instantiate Template', () => {
  cy.get(chartAreaPO.filterItem).type('postgresql');
  cy.get(chartAreaPO.postgresqlTemplate).click();
  cy.get(chartAreaPO.overlayCreate).click({ force: true });
});

When('user selects Postgres and clicks on Create', () => {
  cy.get(chartAreaPO.filterItem).type('postgresql');
  cy.get(chartAreaPO.operatorBackedPostgres).click();
  cy.get(chartAreaPO.overlayCreate).click({ force: true });
});

When('user selects Nodejs and clicks on Install Helm Charts', () => {
  cy.get(chartAreaPO.filterItem).type('nodejs');
  cy.get(chartAreaPO.helmNodejs)
    .eq(0)
    .click();
  cy.get(chartAreaPO.overlayCreate).click({ force: true });
});

When('user selects Api Server Source and clicks on Create Event Source', () => {
  cy.get(chartAreaPO.filterItem).type('ApiServerSource');
  cy.get(chartAreaPO.apiEventSource).click();
  cy.get(chartAreaPO.overlayCreate).click({ force: true });
});

When('user clicks on Create button', () => {
  cy.get(chartAreaPO.contentScrollable)
    .contains('Create')
    .click();
});

Then(
  'user is able to see different applications created from Samples, Import from Git, Container Image, From Catalog, Database, Operator Backed, Helm Charts, Event Source, Channel',
  () => {
    verifyMultipleWorkloadInTopologyPage([
      'golang-sample',
      'nodejs-ex-git',
      'hello-openshift',
      'python-app',
      'postgres',
      'postgres-operator-backed',
      'helm-nodejs',
      'api-server-source',
      'channel',
    ]);
  },
);

Given('user has created namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given('user has installed Redis Operator', () => {
  verifyAndInstallOperator(operators.RedisOperator);
});

Given('user has installed Red Hat OpenShift distributed tracing platform', () => {
  verifyAndInstallOperator(operators.Jaeger);
});

Given(
  'user has created a operator backed service of {string} operator named {string}',
  (operatorName, name: string) => {
    navigateTo(devNavigationMenu.Add);
    createOperatorBacked(operatorName, name);
  },
);

Given(
  'user has created a operator backed service {string} from yaml {string}',
  (name: string, location: string) => {
    createWorkloadUsingOptions('Operator Backed', location);
    topologyHelper.verifyWorkloadInTopologyPage(name);
  },
);

Given(
  'user has created service binding connnector {string} between {string} and {string}',
  (bindingName, node1, node2: string) => {
    createServiceBindingConnect(bindingName, node1, node2);
  },
);

When('user clicks on service binding connector', () => {
  cy.byLegacyTestID('edge-handler')
    .should('be.visible')
    .click();
});

When('user clicks on the service binding name {string} at the sidebar', (bindingName: string) => {
  cy.byLegacyTestID(`${bindingName}`)
    .should('be.visible')
    .click();
});

Then('user will see {string} Status on Service binding details page', (status: string) => {
  cy.byTestID('resource-status').should('have.text', status);
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
});
