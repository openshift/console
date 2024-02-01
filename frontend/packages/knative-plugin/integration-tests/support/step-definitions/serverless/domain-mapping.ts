import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  resourceTypes,
} from '@console/dev-console/integration-tests/support/constants';
import {
  createGitWorkloadIfNotExistsOnTopologyPage,
  gitPage,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages';
import { eventingPO } from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';
import {
  topologyPage,
  topologySidePane,
} from '@console/topology/integration-tests/support/pages/topology';
import { formPO } from '../../../../../dev-console/integration-tests/support/pageObjects/global-po';
import { domainPO } from '../../pageObjects/global-po';
import { functionsPage } from '../../pages/functions/functions-page';

When('user enters Domain mapping as {string}', (domain: string) => {
  cy.get(domainPO.domainMapping).clear().type(domain).should('have.value', domain);
});

When('user clicks on {string} in dropdown', () => {
  cy.get(eventingPO.kafka.dropdownOptions).contains('Create').click();
  cy.get(domainPO.chipGroup).should('be.visible');
});

When('user clicks on knative workload {string}', (workloadName: string) => {
  functionsPage.clickonEmptyAreaTopology();
  topologyPage.knativeNode(workloadName).click({ force: true });
});

Then(
  'user will see {string} under Domain Mappings of Resources tab on sidebar',
  (domain: string) => {
    topologySidePane.verifySelectedTab('Resources');
    cy.get(`[href="https://${domain}"]`).scrollIntoView().should('be.visible');
  },
);

When('user clicks Save button', () => {
  cy.get(formPO.create).click();
});

When('user clicks on Show advanced Routing options', () => {
  cy.get(domainPO.contentScroll).contains('Show advanced Routing options').click();
});

When('user clicks create button', () => {
  gitPage.clickCreate();
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

Given(
  'user has created knative service {string} with domain mapping {string}',
  (workloadName: string, domain: string) => {
    createGitWorkloadIfNotExistsOnTopologyPage(
      'https://github.com/sclorg/nodejs-ex.git',
      workloadName,
      resourceTypes.knativeService,
    );
    topologyPage.rightClickOnGroup(workloadName);
    topologyPage.selectContextMenuAction(`Edit ${workloadName}`);
    cy.get(domainPO.contentScroll).contains('Show advanced Routing options').click();
    cy.get(domainPO.domainMapping).clear().type(domain).should('have.value', domain);
    cy.get(eventingPO.kafka.dropdownOptions).click();
    cy.get(domainPO.chipGroup).should('be.visible');
    cy.get(formPO.create).click();
    topologyPage.verifyTopologyPage();
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
  },
);

When(
  'user selects {string} from actions drop down menu of knative service {string}',
  (option: string, workloadName: string) => {
    functionsPage.clickonEmptyAreaTopology();
    topologyPage.knativeNode(workloadName).click({ force: true });
    cy.get(eventingPO.broker.actionMenu).click();
    cy.byTestActionID(option).click();
  },
);

When('user removes already added custom domain mapping {string} and {string}', (d1, d2) => {
  cy.get(domainPO.chipArea).should('be.visible').click();
  cy.get(`[id="select-option-serverless.domainMapping-${d1}"] button`).should('be.visible').click();
  cy.get(`[id="select-option-serverless.domainMapping-${d2}"] button`).should('be.visible').click();
  cy.get(domainPO.chipDescribe).should('not.contain', d1).and('not.contain', d2);
});

Then(
  'user will not see {string} under Domain Mappings of Resources tab on sidebar',
  (domain: string) => {
    topologySidePane.verifySelectedTab('Resources');
    cy.get(`[href="https://${domain}"]`).should('not.exist');
  },
);

Given('user can see knative service {string} exist in topology page', (workloadName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

When('user removes already added custom domain mapping {string}', (d1) => {
  cy.get(domainPO.chipArea).should('be.visible').click();
  cy.get(`[id="select-option-serverless.domainMapping-${d1}"] button`).should('be.visible').click();
  cy.get(domainPO.chipDescribe).should('not.contain', d1);
});
