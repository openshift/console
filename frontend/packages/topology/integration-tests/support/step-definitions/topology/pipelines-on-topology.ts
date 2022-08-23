import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import {
  createGitWorkload,
  createGitWorkloadWithBuilderImage,
} from '@console/dev-console/integration-tests/support/pages';
import { navigateTo, perspective } from '@console/dev-console/integration-tests/support/pages/app';
import { topologyPO } from '../../page-objects/topology-po';
import { topologyPage, topologySidePane } from '../../pages/topology';

Given(
  'user has created workload {string} with resource type {string} with pipeline',
  (componentName: string, resourceName: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceName,
      'nodejs-ex-git-app',
      true,
    );
  },
);

Given(
  'user has created workload {string} with resource type {string} without pipeline',
  (componentName: string, resourceName: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceName,
      'nodejs-ex-git-app',
      false,
    );
  },
);

Given(
  'user has created workload {string} with resource type {string} and builder image {string} with pipeline',
  (componentName: string, resourceName: string, builderImage: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkloadWithBuilderImage(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceName,
      builderImage,
      'nodejs-ex-git-app',
      true,
    );
  },
);

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on workload {string} to open sidebar', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
  topologyPage.waitForLoad();
});

Then('user can see {string} section in Resources tab', (heading: string) => {
  topologySidePane.selectTab('Resources');
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifySection(heading);
});

When('user goes to the pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

Then('user can see the {string} pipeline is succeeded', (workloadName: string) => {
  cy.byLegacyTestID('item-filter')
    .clear()
    .type(workloadName);
  cy.byTestID('status-text', { timeout: 180000 }).should('include.text', 'Succeeded');
});

When('user goes to the Administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

When('user clicks on the Persistent Volume Claims in Storage tab', () => {
  cy.get(topologyPO.pipelines.storageNav).click();
  cy.get(topologyPO.pipelines.pvcOption)
    .eq(0)
    .click();
});

When('user can see workspace created for the resource', () => {
  cy.get(topologyPO.pipelines.pvc)
    .invoke('attr', 'aria-rowcount')
    .should('have.length.greaterThan', 0);
});

When('user clicks on Start on the {string} pipeline', (workloadName: string) => {
  cy.byLegacyTestID('item-filter')
    .clear()
    .type(workloadName);
  cy.wait(2000);
  cy.byLegacyTestID('kebab-button').click();
  cy.get(topologyPO.pipelines.startAction).click();
});

When('user can see "PVC" in workspace with name of PVC', () => {
  cy.byLegacyTestID('dropdown-button').should('include.text', 'PersistentVolumeClaim');
  cy.get(topologyPO.pipelines.pvcIcon).should('include.text', 'PVC');
  cy.byLegacyTestID('modal-cancel-action').click();
});

When('user clicks on Add Trigger on the {string} pipeline', (workloadName: string) => {
  cy.byLegacyTestID('item-filter')
    .clear()
    .type(workloadName);
  cy.wait(2000);
  cy.byLegacyTestID('kebab-button').click();
  cy.get(topologyPO.pipelines.addTriggerAction).click();
});

When('user clicks on Edit {string} from action menu', (workloadName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.waitForLoad();
  topologyPage.componentNode(workloadName).click({ force: true });
  cy.byLegacyTestID('actions-menu-button').click();
  cy.byTestActionID(`Edit ${workloadName}`).click();
});

When('user can see Pipeline checkbox is disabled', () => {
  cy.get(topologyPO.pipelines.pipelineCheckbox).should('be.disabled');
});

When('user can not see Build configuration option in Advanced Options', () => {
  cy.get(topologyPO.pipelines.editWorkloadPage).should('not.include.text', 'Build Configuration');
});

When('user can see Pipeline section is present', () => {
  cy.get(topologyPO.pipelines.pipelineSection)
    .scrollIntoView()
    .should('be.visible');
});

When('user can see Pipeline checkbox is present in enabled state', () => {
  cy.get(topologyPO.pipelines.pipelineCheckbox).should('be.enabled');
});

When('user checks the Pipeline checkbox to disable build configuration in Advanced Options', () => {
  cy.get(topologyPO.pipelines.pipelineCheckbox).check();
  cy.get(topologyPO.pipelines.editWorkloadPage).should('not.include.text', 'Build Configuration');
});

Then('user can see PipelineRuns section is present', () => {
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifySection(pageTitle.PipelineRuns);
});

Then('user can see Build section is present', () => {
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifySection(pageTitle.Builds);
});

Then(
  'user edit the workload {string} with {string}',
  (workloadName: string, builderImage: string) => {
    topologyPage.waitForLoad();
    topologyPage.componentNode(workloadName).click({ force: true });
    cy.byLegacyTestID('actions-menu-button').click();
    cy.byTestActionID(`Edit ${workloadName}`).click();
    cy.byTestID(`card ${builderImage}`).click();
    cy.byTestID('submit-button').click();
  },
);
