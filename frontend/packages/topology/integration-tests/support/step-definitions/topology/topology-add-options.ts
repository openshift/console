import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { operators } from '@console/dev-console/integration-tests/support/constants';
import {
  createGitWorkloadIfNotExistsOnTopologyPage,
  projectNameSpace,
  topologyHelper,
  topologyPage,
  verifyAndInstallOperator,
} from '@console/dev-console/integration-tests/support/pages';
import { topologyAddOptionsPO } from '../../page-objects/topology-add-options-po';

Given('user has installed OpenShift Serverless Operator', () => {
  verifyAndInstallOperator(operators.ServerlessOperator);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given(
  'user has created {string} workload in {string} application',
  (nodeName: string, appName: string) => {
    createGitWorkloadIfNotExistsOnTopologyPage(
      'https://github.com/sclorg/nodejs-ex.git',
      nodeName,
      'Deployment',
      appName,
    );
    topologyHelper.verifyWorkloadInTopologyPage(nodeName);
  },
);

When('user right clicks on empty graph view', () => {
  cy.byLegacyTestID('topology').rightclick(10, 10);
});

When('user hovers on Add to Project', () => {
  cy.get('.odc-topology-context-menu').trigger('mouseover');
});

Then(
  'user can see in context options {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}',
  (
    s1: string,
    s2: string,
    s3: string,
    s4: string,
    s5: string,
    s6: string,
    s7: string,
    s8: string,
    s9: string,
  ) => {
    cy.get(topologyAddOptionsPO(s1)).should('be.visible');
    cy.get(topologyAddOptionsPO(s2)).should('be.visible');
    cy.get(topologyAddOptionsPO(s3)).should('be.visible');
    cy.get(topologyAddOptionsPO(s4)).should('be.visible');
    cy.get(topologyAddOptionsPO(s5)).should('be.visible');
    cy.get(topologyAddOptionsPO(s6)).should('be.visible');
    cy.get(topologyAddOptionsPO(s7)).should('be.visible');
    cy.get(topologyAddOptionsPO(s8)).should('be.visible');
    cy.get(topologyAddOptionsPO(s9)).should('be.visible');
  },
);

When('user right clicks on Application Grouping {string}', (appName: string) => {
  topologyPage.rightClickOnApplicationGroupings(appName);
});

When('user hovers on Add to application', () => {
  cy.get('.odc-topology-context-menu')
    .contains('Add to application')
    .trigger('mouseover');
});

Then(
  'user can see in context options {string}, {string}, {string}, {string}',
  (s1: string, s2: string, s3: string, s4: string) => {
    cy.get(topologyAddOptionsPO(s1)).should('be.visible');
    cy.get(topologyAddOptionsPO(s2)).should('be.visible');
    cy.get(topologyAddOptionsPO(s3)).should('be.visible');
    cy.get(topologyAddOptionsPO(s4)).should('be.visible');
  },
);

When('user clicks on Delete application', () => {
  cy.get('.odc-topology-context-menu')
    .contains('Delete application')
    .click();
});

When(
  'user enters the name {string} in the Delete application modal and clicks on Delete button',
  (appName: string) => {
    topologyPage.deleteApplication(appName);
  },
);

Then("user won't be able to see the {string} Application Groupings", (appName: string) => {
  topologyPage.verifyApplicationGroupingsDeleted(appName);
});
