import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  nodeActions,
  resourceTypes,
} from '@console/dev-console/integration-tests/support/constants';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  createEventSourcePage,
  createGitWorkload,
  editAnnotations,
  editApplicationGrouping,
  editLabels,
  navigateTo,
  setTrafficDistribution,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';
import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';

When('user right clicks on the knative service {string}', (serviceName: string) => {
  topologyPage.waitForLoad();
  topologyPage.rightClickOnKnativeService(serviceName);
});

Given('user has created {string} event source', (eventSourceName: string) => {
  navigateTo(devNavigationMenu.Add);
  createEventSourcePage.createSinkBinding(eventSourceName);
});

When('user right clicks on the knative service {string}', (knativeServiceName: string) => {
  topologyPage.rightClickOnNode(knativeServiceName);
});

Then(
  'user is able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service, Edit {string}',
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

Given(
  'user created another revision {string} for knative Service {string}',
  (revisionName: string, knativeServiceName: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      revisionName,
      resourceTypes.knativeService,
      knativeServiceName,
    );
    topologyPage.verifyWorkloadInTopologyPage(revisionName);
  },
);

Then('user clicks Delete button on Delete Service modal', () => {
  modal.modalTitleShouldContain('Delete Service?');
  modal.submit();
  modal.shouldBeClosed();
});

When('user clicks on Add Revision button present in Set Traffic Distribution modal', () => {
  setTrafficDistribution.add();
});

When(
  'user adds the label {string} to exisitng labels list in Edit Labels modal',
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
  cy.get('[data-test-id="base-node-handler"]', { timeout: 150000 }).should('be.visible');
});

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
  setTrafficDistribution.enterSplit(splitPercentage);
});

When('user enters {string} into the Split text box of new revision', (splitPercentage: string) => {
  setTrafficDistribution.enterSplit(splitPercentage);
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
    topologyPage.selectContextMenuAction(nodeActions.EditLabels);
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

Then('{string} service should not be displayed in project', (serviceName: string) => {
  cy.get('body').then(($body) => {
    if ($body.find(topologyPO.graph.node).length) {
      topologyPage.search(serviceName);
      cy.get(topologyPO.highlightNode).should('not.be.visible');
    } else {
      topologyPage.verifyNoWorkLoadsText('No resources found');
    }
  });
});

When('user clicks save button on yaml page', () => {
  cy.get('#save-changes').click();
});

When('user clicks cancel button on {string} page', (pageName: string) => {
  detailsPage.titleShouldContain(pageName);
  cy.byLegacyTestID('reset-button').click();
});

When(
  'user removes the label {string} from exisitng labels list in {string} modal',
  (labelName: string, modalHeader: string) => {
    modal.modalTitleShouldContain(modalHeader);
    editLabels.removeLabel(labelName);
  },
);

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

Then(
  'updated service {string} is present in side bar of application {string}',
  (serviceName: string, applicationName: string) => {
    topologyPage.clickOnKnativeService(serviceName);
    topologySidePane.verifyResource(applicationName);
  },
);
