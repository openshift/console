import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { resourceTypes } from '../../../../../dev-console/integration-tests/support/constants/add';
import { topologyPage } from '../../../../../dev-console/integration-tests/support/pages/topology/topology-page';
import { topologySidePane } from '../../../../../dev-console/integration-tests/support/pages/topology/topology-side-pane-page';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import {
  editLabels,
  editAnnotations,
  deleteRevision,
  setTrafficDistribution,
  editApplicationGrouping,
} from '../../../../../dev-console/integration-tests/support/pages/modal';
import { navigateTo } from '../../../../../dev-console/integration-tests/support/pages/app';
import { createGitWorkload } from '../../../../../dev-console/integration-tests/support/pages/functions/createGitWorkload';
import { devNavigationMenu } from '../../../../../dev-console/integration-tests/support/constants/global';
import { createEventSourcePage } from '../../../../../dev-console/integration-tests/support/pages/add-flow/event-source-page';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects/topology-po';
import { nodeActions } from '@console/dev-console/integration-tests/support/constants/topology';

Given('user has created knative service {string}', (knativeServiceName: string) => {
  navigateTo(devNavigationMenu.Topology);
  cy.get('#content-scrollable').then(($body) => {
    topologyPage.waitForLoad();
    if ($body.find(topologyPO.search).length) {
      topologyPage.search(knativeServiceName);
      if ($body.find(topologyPO.highlightNode).length === 0) {
        navigateTo(devNavigationMenu.Add);
        createGitWorkload(
          'https://github.com/sclorg/nodejs-ex.git',
          knativeServiceName,
          resourceTypes.knativeService,
        );
        topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
      }
    } else {
      navigateTo(devNavigationMenu.Add);
      createGitWorkload(
        'https://github.com/sclorg/nodejs-ex.git',
        knativeServiceName,
        resourceTypes.knativeService,
      );
      topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
    }
  });
});

Given('user has created or selected knative service {string}', (knativeServiceName: string) => {
  navigateTo(devNavigationMenu.Topology);
  cy.get('#content-scrollable').then(($body) => {
    topologyPage.waitForLoad();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    if ($body.find(topologyPO.search).length !== 0) {
      topologyPage.search(knativeServiceName);
      if ($body.find(topologyPO.highlightNode).length === 0) {
        navigateTo(devNavigationMenu.Add);
        createGitWorkload(
          'https://github.com/sclorg/nodejs-ex.git',
          knativeServiceName,
          resourceTypes.knativeService,
        );
        topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
      }
    } else {
      navigateTo(devNavigationMenu.Add);
      createGitWorkload(
        'https://github.com/sclorg/nodejs-ex.git',
        knativeServiceName,
        resourceTypes.knativeService,
      );
      topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
    }
  });
});

When('user clicks on save', () => {
  modal.submit();
});

Given('user has created another knative service {string}', (knativeServiceName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    knativeServiceName,
    resourceTypes.knativeService,
  );
  topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
});

Given(
  'user has created knative services {string} and {string}',
  (knativeServiceName: string, knativeServiceName1: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      knativeServiceName,
      resourceTypes.knativeService,
    );
    topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      knativeServiceName1,
      resourceTypes.knativeService,
    );
    topologyPage.verifyWorkloadInTopologyPage(knativeServiceName1);
  },
);

Given('user has created {string} event source', (eventSourceName: string) => {
  navigateTo(devNavigationMenu.Topology);
  cy.get('#content-scrollable').then(($body) => {
    if ($body.find(topologyPO.search).length) {
      topologyPage.search(eventSourceName);
      if ($body.find(topologyPO.highlightNode).length === 0) {
        navigateTo(devNavigationMenu.Add);
        createEventSourcePage.createSinkBinding(eventSourceName);
      }
      topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
    } else {
      navigateTo(devNavigationMenu.Add);
      createEventSourcePage.createSinkBinding(eventSourceName);
      topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
    }
  });
});

When('user right clicks on the knative service {string}', (knativeServiceName: string) => {
  topologyPage.rightClickOnNode(knativeServiceName);
});

Then(
  'user is able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service, {string}',
  (knativeServiceName: string) => {
    cy.byTestActionID(nodeActions.EditApplicationGrouping).should('be.visible');
    cy.byTestActionID(nodeActions.SetTrafficDistribution).should('be.visible');
    cy.byTestActionID(`Edit ${knativeServiceName}`).should('be.visible');
    cy.byTestActionID(nodeActions.EditHealthChecks).should('be.visible');
    cy.byTestActionID(nodeActions.EditLabels).should('be.visible');
    cy.byTestActionID(nodeActions.EditAnnotations).should('be.visible');
    cy.byTestActionID(nodeActions.EditService).should('be.visible');
    cy.byTestActionID(nodeActions.DeleteService).should('be.visible');
  },
);

When(
  'user adds the label {string} to existing labels list in Edit Labels modal',
  (labelName: string) => {
    editLabels.enterLabel(labelName);
  },
);

When('user clicks the save button on the {string} modal', (modalTitle: string) => {
  modal.modalTitleShouldContain(modalTitle);
  modal.submit();
});

When('user clicks the cancel button on the {string} modal', (modalTitle: string) => {
  modal.modalTitleShouldContain(modalTitle);
  modal.cancel();
});

When('user searches for application name {string}', (appName: string) => {
  topologyPage.search(appName);
});

Given('service should have at least 2 revisions', () => {
  cy.get(topologyPO.graph.node, { timeout: 150000 }).should('be.visible');
});

Given(
  'user created another revision {string} for knative Service {string',
  (revisionName: string, knativeServiceName: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      revisionName,
      resourceTypes.knativeService,
      knativeServiceName,
    );
    topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
    cy.get(topologyPO.graph.node, { timeout: 150000 }).should('have.length', 2);
  },
);

When(
  'user selects {string} context menu option of knative service {string}',
  (option: string, knativeServiceName: string) => {
    topologyPage.rightClickOnNode(knativeServiceName);
    topologyPage.selectContextMenuAction(option);
  },
);

When('user clicks Add button on the Edit Annotations modal', () => {
  editAnnotations.add();
});

Given(
  'user created another revision {string} for knative Service {string}',
  (revisionName: string, serviceName: string) => {
    topologyPage.waitForKnativeRevision();
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      revisionName,
      resourceTypes.knativeService,
      serviceName,
    );
  },
);

Given(
  'number of annotations are {string} present in {string} service side bar details tab',
  (numOfAnnotations: string, serviceName: string) => {
    topologyPage.clickOnNode(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyNumberOfAnnotations(numOfAnnotations);
    topologySidePane.close();
  },
);

When('user enters annotation key as {string}', (key: string) => {
  editAnnotations.enterKey(key);
});

When('user enters annotation value as {string}', (value: string) => {
  editAnnotations.enterValue(value);
});

When('user enters {string} into the Split text box', (splitPercentage: string) => {
  cy.get('[id$="percent-field"]')
    .last()
    .type(splitPercentage);
});

When(
  'user clicks on Add Revision button present in Set Traffic Distribution modal',
  (a: string, b: string) => {
    setTrafficDistribution.add();
    cy.log(a, b);
  },
);

When('user enters {string} into the Split text box of new revision', (splitPercentage: string) => {
  cy.get('[id$="percent-field"]')
    .last()
    .type(splitPercentage);
});

When('user selects another revision from Revision drop down', () => {
  cy.byLegacyTestID('dropdown-button').click();
  cy.byLegacyTestID('dropdown-menu')
    .last()
    .click();
});

Then(
  'user will see the label {string} in {string} service side bar details',
  (label: string, serviceName: string) => {
    topologyPage.clickOnNode(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyLabel(label);
  },
);

Then(
  'user will not see the label {string} in {string} service side bar details',
  (label: string, serviceName: string) => {
    topologyPage.clickOnNode(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    cy.get('[data-test-selector="details-item-label__Labels"]').should('be.visible');
    cy.get('[data-test="label-list"] a')
      .contains(label)
      .should('not.be.visible');
  },
);

Given(
  'label {string} is added to the knative service {string}',
  (labelName: string, knativeServiceName: string) => {
    topologyPage.rightClickOnNode(knativeServiceName);
    topologyPage.selectContextMenuAction('Edit Labels');
    modal.shouldBeOpened();
    editLabels.enterLabel(labelName);
    modal.submit();
  },
);

Then(
  'number of Annotations increased to {string} in {string} service side bar details',
  (numOfAnnotations: string, serviceName: string) => {
    topologyPage.clickOnNode(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyNumberOfAnnotations(numOfAnnotations);
  },
);

Then(
  'number of Annotations display as {string} in {string} service side bar details',
  (numOfAnnotations: string, serviceName: string) => {
    topologyPage.clickOnNode(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyNumberOfAnnotations(numOfAnnotations);
  },
);

When(
  'user clicks on remove icon for the annotation with key {string} present in Edit Annotations modal',
  (key: string) => {
    editAnnotations.removeAnnotation(key);
  },
);

Then('error message displays as {string}', (errorMessage: string) => {
  cy.get('div[aria-label="Danger Alert"] div.co-pre-line').should('contain.text', errorMessage);
});

Then('number of routes should get increased in side bar - resources tab - routes section', () => {
  topologyPage.clickOnNode('nodejs-ex-git-1');
  topologySidePane.verify();
  topologySidePane.verifyTab('Resources');
  cy.get('[title="Route"]').should('have.length', 2);
});

Then('modal displayed with header name {string}', (headerName: string) => {
  modal.modalTitleShouldContain(headerName);
});

Then('modal get closed on clicking Delete button', () => {
  modal.submit();
  cy.get('form').should('not.be.visible');
});

Then('modal should get closed on clicking OK button', () => {
  deleteRevision.clickOK();
});

Then('{string} service should not be displayed in project', (serviceName: string) => {
  topologyPage.verifyNoWorkLoadsText('No resources found').then(() => {
    cy.log(`${serviceName} is removed from the project namespace`);
  });
});

When('user clicks save button on yaml page', () => {
  cy.get('#save-changes').click();
});

When('user clicks cancel button on {string} page', (pageName: string) => {
  detailsPage.titleShouldContain(pageName);
  cy.byLegacyTestID('reset-button').click();
});

When('user selects the {string} option from Application drop down', () => {
  // TODO: implement step
});

When('user modifies the Yaml file of the Service details page', () => {
  // TODO: implement step
});

When('user enters {string} into the Application Name text box', (appName: string) => {
  // TODO: implement step
  cy.log(appName);
});

Given(
  'number of annotations are {string} present in side bar - details tab- annotation section',
  (a: string) => {
    cy.log(a);
    // TODO: implement step
  },
);

Given('number of annotations are {string} present in side bar - details tab', (a: string) => {
  cy.log(a);
  // TODO: implement step
});

When(
  'user removes the label {string} from existing labels list in {string} modal',
  (labelName: string, modalHeader: string) => {
    modal.modalTitleShouldContain(modalHeader);
    editLabels.removeLabel(labelName);
  },
);

When(
  'user clicks on {string} icon for the annotation with key {string} present in {string} modal',
  (a: string, b: string, c: string) => {
    cy.log(a, b, c);
    // TODO: implement step
  },
);

When('user clicks {string} button on the {string} modal', (a: string, b: string) => {
  cy.log(a, b);
  // TODO: implement step
});

When('user modifies the Yaml file of the Revision details page', () => {
  // TODO: implement step
});

When('user clicks save button on the Edit Service Page', () => {
  // TODO: implement step
});

When(
  'user selects the {string} option from application drop down present in {string} modal',
  (option: string, modalHeader: string) => {
    modal.modalTitleShouldContain(modalHeader);
    editApplicationGrouping.selectApplication(option);
  },
);

Then('number of Annotations decreased to {string} in side bar details', (num: string) => {
  topologySidePane.verifyNumberOfAnnotations(num);
});

Then('message should display as {string}', (message: string) => {
  cy.log(message);
  // TODO: implement step
});

Then('another message should display as {string}', (message: string) => {
  cy.log(message);
  // TODO: implement step
});

Then(
  'updated service {string} is present in side bar of application {string}',
  (serviceName: string, applicationName: string) => {
    // topologySidePane.verifyResourcesForApplication(applicationName, serviceName);
    cy.log(serviceName, applicationName);
  },
);

Then(
  'updated service {string} should not display in side bar of application {string}',
  (serviceName: string, applicationName: string) => {
    // topologyPage.clickOnApplicationNode(applicationName);
    cy.log(applicationName);
    cy.byLegacyTestID(serviceName).should('not.be.visible');
  },
);
