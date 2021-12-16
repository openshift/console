import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  nodeActions,
  resourceTypes,
} from '@console/dev-console/integration-tests/support/constants';
import { formPO, topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  addHealthChecksPage,
  app,
  containerImagePage,
  createEventSourcePage,
  createForm,
  createGitWorkload,
  editAnnotations,
  editApplicationGrouping,
  editLabels,
  gitPage,
  navigateTo,
  setTrafficDistribution,
  topologyActions,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';

let numOfAnnotationsBeforeAdd: number;
let numOfAnnotationsAfterAdd: number;

When('user right clicks on the knative service {string}', (serviceName: string) => {
  topologyPage.verifyUserIsInGraphView();
  topologyPage.waitForLoad();
  topologyPage.rightClickOnKnativeService(serviceName);
});

When(
  'user right clicks on the knative service {string} to open the context menu',
  (serviceName: string) => {
    topologyPage.verifyUserIsInGraphView();
    topologyPage.waitForLoad();
    topologyPage.rightClickOnKnativeService(serviceName);
  },
);

Given('user has created {string} event source', (eventSourceName: string) => {
  navigateTo(devNavigationMenu.Add);
  createEventSourcePage.createSinkBinding(eventSourceName);
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

Given(
  'user created another revision for knative Service {string} for deploy image',
  (knativeService: string) => {
    // Update the workload details, then automatically new revision gets created
    topologyPage.rightClickOnKnativeService(knativeService);
    topologyPage.selectContextMenuAction(`Edit ${knativeService}`);
    detailsPage.titleShouldContain('Deploy Image');
    cy.get('button')
      .contains('Labels')
      .scrollIntoView()
      .click();
    gitPage.enterLabels('app=frontend');
    cy.get(formPO.create).click();
    topologyPage.verifyTopologyPage();
    topologyPage.clickOnKnativeService(knativeService);
    topologySidePane.selectTab('Resources');
    topologySidePane.verifySection('Revisions');
    cy.get('.revision-overview-list')
      .next('ul')
      .find('li')
      .should('have.length', 2);
  },
);

Given('user created another revision for knative Service {string}', (knativeService: string) => {
  // Update the workload details, then automatically new revision gets created
  topologyPage.clickOnKnativeService(knativeService);
  cy.get(topologyPO.sidePane.knativeServiceIcon)
    .next('a')
    .click();
  cy.contains('Service details').should('be.visible');
  cy.byLegacyTestID('horizontal-link-public~Details').click();
  cy.get('button')
    .contains('Labels')
    .scrollIntoView()
    .click();
  gitPage.enterLabels('app=frontend');
  cy.get(formPO.create).click();
  navigateTo(devNavigationMenu.Topology);
  topologyPage.clickOnKnativeService(knativeService);
  topologySidePane.selectTab('Resources');
  topologySidePane.verifySection('Revisions');
  cy.get('.revision-overview-list')
    .next('ul')
    .find('li')
    .should('have.length', 2);
});

When('user modifies the details of knative service', () => {
  app.waitForLoad();
  cy.get('button')
    .contains('Labels')
    .scrollIntoView()
    .click();
  gitPage.enterLabels('app=frontend');
});

Then(
  'user is able to see multiple revisions for knative service {string} in Resources section of topology sidePane',
  (serviceName: string) => {
    cy.log(
      `user is able to see revisions in knative service : ${serviceName} of topology side pane`,
    );
    topologySidePane.selectTab('Resources');
    topologySidePane.verifySection('Revisions');
    cy.get('.revision-overview-list')
      .next('ul')
      .find('li')
      .should('have.length', 2);
  },
);

When('user clicks Save on the Edit knative service page', () => {
  cy.get(formPO.create).click();
  topologyPage.verifyTopologyPage();
});

Then('user clicks Delete button on Delete Service modal', () => {
  modal.modalTitleShouldContain('Delete Service?');
  modal.submit();
  modal.shouldBeClosed();
});

When('user clicks on Add Revision button present in Set Traffic Distribution modal', () => {
  setTrafficDistribution.add();
});

When('user clicks on {string} on topology page', (nodeName: string) => {
  topologyPage.clickOnNode(nodeName);
});

When('user clicks on application node {string} on topology page', (appName: string) => {
  topologyPage.clickOnApplicationGroupings(appName);
});

When(
  'user adds the label {string} to existing labels list in Edit Labels modal',
  (labelName: string) => {
    editLabels.enterLabel(labelName);
  },
);

When('user clicks save button on the {string} modal', (modalTitle: string) => {
  modal.modalTitleShouldContain(modalTitle);
  modal.submit();
  modal.shouldBeClosed();
});

When('user clicks cancel button on the {string} modal', (modalTitle: string) => {
  modal.modalTitleShouldContain(modalTitle);
  modal.cancel();
});

When('user searches for application name {string}', (appName: string) => {
  topologyPage.search(appName);
});

Given('service should have at least 2 revisions', () => {
  topologyPage.waitForKnativeRevision();
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
  'number of annotations present in topology side bar for {string} service',
  (serviceName: string) => {
    topologyPage.clickOnNode(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    cy.get(topologyPO.sidePane.editAnnotations).then(($el) => {
      const res = $el.text().split(' ');
      numOfAnnotationsBeforeAdd = Number(res[0]);
      cy.log(`Number of Annotations before Add: ${res[0]}`);
    });
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
  cy.byLegacyTestID('dropdown-button')
    .eq(1)
    .click();
  cy.byLegacyTestID('dropdown-menu')
    .first()
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
    cy.byTestID('label-list')
      .find('a')
      .should('be.visible');
    cy.contains(label, { timeout: 80000 }).should('not.exist');
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
  'number of Annotations increased for {string} service in topology side bar details',
  (serviceName: string) => {
    topologyPage.clickOnNode(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    cy.get(topologyPO.sidePane.editAnnotations).then(($el) => {
      const res = $el.text().split(' ');
      numOfAnnotationsAfterAdd = Number(res[0]);
      cy.log(`Number of Annotations: ${res[0]}`);
      expect(numOfAnnotationsAfterAdd).toBeGreaterThan(numOfAnnotationsBeforeAdd);
    });
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

Then(
  'number of revisions should get increased in side bar - resources tab - routes section',
  () => {
    topologySidePane.verify();
    topologySidePane.selectTab('Resources');
    cy.get('[title="Revision"]').should('have.length', 2);
  },
);

Then('{string} service should not be displayed in project', (serviceName: string) => {
  cy.get(topologyPO.graph.knativeServiceNode)
    .should('not.exist')
    .then(() => {
      cy.log(`Knative service: ${serviceName} is deleted`);
    });
});

When('user clicks on {string} to open sidebar', (workloadName: string) => {
  topologyPage.clickOnNode(workloadName);
});

Then(
  'user is able to see 2 workloads {string} and {string}',
  (workload1: string, workload2: string) => {
    topologyPage.verifyWorkloadInTopologyPage(workload1);
    topologyPage.verifyWorkloadInTopologyPage(workload2);
    cy.get('[title="service]').should('be.visible');
  },
);

When('user clicks save button on yaml page', () => {
  cy.get('#save-changes').click();
});

When('user clicks cancel button on {string} page', (pageName: string) => {
  detailsPage.titleShouldContain(pageName);
  cy.byLegacyTestID('reset-button').click();
});

When('user enters the Name as {string} in Make Serverless form', (workloadName: string) => {
  gitPage.enterComponentName(workloadName);
});

When('user clicks on Create button in Make Serverless form', () => {
  cy.get(formPO.save).click({ force: true });
});

When(
  'user removes the label {string} from existing labels list in {string} modal',
  (labelName: string, modalHeader: string) => {
    modal.modalTitleShouldContain(modalHeader);
    editLabels.removeLabel(labelName);
  },
);

When(
  'user selects the {string} option from application drop down present in Edit Application grouping modal',
  (option: string) => {
    modal.modalTitleShouldContain(nodeActions.EditApplicationGrouping);
    editApplicationGrouping.selectApplication(option);
  },
);

When(
  'user selects the Create Application option from application drop down present in Edit Application grouping modal',
  () => {
    modal.modalTitleShouldContain(nodeActions.EditApplicationGrouping);
    cy.get('#form-dropdown-application-name-field').click();
    editApplicationGrouping.clickCreateApplication();
  },
);

Then(
  'number of Annotations decreased for {string} service in topology side bar details',
  (serviceName: string) => {
    topologyPage.clickOnNode(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    cy.get(topologyPO.sidePane.editAnnotations).then(($el) => {
      const res = $el.text().split(' ');
      expect(Number(res[0])).toEqual(numOfAnnotationsBeforeAdd);
    });
  },
);

Then(
  'updated service {string} is present in side bar of application {string}',
  (serviceName: string, applicationName: string) => {
    cy.log(`Verifying service ${serviceName} is present in application ${applicationName}`);
    topologySidePane.verifyResource(serviceName);
  },
);

When('user enters {string} into the Application Name text box', (appName: string) => {
  editApplicationGrouping.enterApplicationName(appName);
});

When('user adds the Liveness probe details', () => {
  addHealthChecksPage.addLivenessProbe();
});

When('user clicks Save on Edit health checks page', () => {
  addHealthChecksPage.clickSave();
});

Then('user redirects to topology page', () => {
  topologyPage.verifyTopologyPage();
});

When('user selects the {string} option from Application drop down', (option: string) => {
  containerImagePage.selectOrCreateApplication(option);
});

When('user clicks save button on the Deploy Image Page', () => {
  createForm.clickSave();
});

Then('user is not able to see application group in Topology page', () => {
  cy.byTestID('icon application').should('not.exist');
});

When('user selects option {string} from Actions menu drop down', (action: string) => {
  cy.byLegacyTestID('actions-menu-button').click();
  topologyActions.selectAction(action);
});

Given('user has created git workload {string}', (workload: string) => {
  createGitWorkload('https://github.com/sclorg/nodejs-ex.git', workload);
});

Given('workload build is completed', () => {
  cy.get('[aria-label="Build Complete"]', { timeout: 200000 }).should('be.visible');
});

Given('workload {string} is present in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});
