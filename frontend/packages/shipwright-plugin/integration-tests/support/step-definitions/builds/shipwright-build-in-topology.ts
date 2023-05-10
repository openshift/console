import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import {
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';
import { buildPO, topologyPO } from '../../pageObjects';

Given('user has created shipwright builds with resources', () => {
  let yamlFileName = `testData/builds/shipwrightBuildStrategies.yaml`;
  cy.exec(`oc apply -n ${Cypress.env('NAMESPACE')} -f ${yamlFileName}`, {
    failOnNonZeroExit: false,
  });

  yamlFileName = `testData/workload/201-full-openshift-deployment-example.yaml`;
  cy.exec(`oc create -n ${Cypress.env('NAMESPACE')} -f ${yamlFileName}`, {
    failOnNonZeroExit: false,
  });

  yamlFileName = `testData/workload/202-full-openshift-deploymentconfig-example.yaml`;
  cy.exec(`oc create -n ${Cypress.env('NAMESPACE')} -f ${yamlFileName}`, {
    failOnNonZeroExit: false,
  });

  yamlFileName = `testData/workload/203-full-openshift-knative-service-example.yaml`;
  cy.exec(`oc create -n ${Cypress.env('NAMESPACE')} -f ${yamlFileName}`, {
    failOnNonZeroExit: false,
  });
});

Given('user has created workload using yaml {string}', (yamlFileName: string) => {
  cy.exec(`oc create -n ${Cypress.env('NAMESPACE')} -f ${yamlFileName}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout);
  });
});

Then('user will delete the workload using yaml {string}', (yamlFileName: string) => {
  cy.exec(`oc delete -n ${Cypress.env('NAMESPACE')} -f ${yamlFileName}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout);
  });
});

When(
  'user filters the workload {string} by name and sets the workload type to {string}',
  (workload: string, type: string) => {
    topologyPage.verifyWorkloadInTopologyPage(workload);

    cy.get(topologyPO.filterByResourceDropDown).should('be.visible').click();
    cy.get(`[data-test="${type}"] input`).check();
  },
);

When('user clicks on the Build decorator attached to {string}', (workload: string) => {
  cy.get(`[data-test="${workload}-decorator"]`).should('be.visible');
  cy.get(`[data-test="${workload}-decorator"]`).click();
});

Then('user will be redirected to the buildRun logs page', () => {
  cy.url().should('include', '/logs');
});

Then('user will be able to see the buildRun logs', () => {
  cy.get(buildPO.shipwrightBuild.buildrunLogs).should('be.visible');
});

When('user clicks on the workload of type {string}', (type: string) => {
  if (type === 'Service') {
    cy.get('g.odc-knative-service__label > text').first().click({ force: true });
  } else {
    cy.get(topologyPO.highlightNode).within(() => {
      cy.get('g.pf-topology__node__label > text').click({ force: true });
    });
  }
});

Then(
  'user will clicks on the Resources tab on the topology sidebar for {string}',
  (workload: string) => {
    topologySidePane.verify();
    topologySidePane.verifyTitle(workload);
    topologySidePane.verifySelectedTab('Resources');
  },
);

Then('user will verify BuildRuns section is visible', () => {
  topologySidePane.verifySection('BuildRuns');
});

Then('user will see build running for {string}', (type: string) => {
  if (type === 'Service') {
    cy.get('g.odc-knative-service__label > text').click({ force: true });

    cy.get('div.ocs-sidebar-tabsection:nth-child(6)')
      .find('ul.list-group > li.odc-build-run-item')
      .should('have.length.greaterThan', 1);
  } else {
    cy.get('g.pf-topology__node__label > text').click({ force: true });
    cy.get('div.ocs-sidebar-tabsection:nth-child(5)')
      .find('ul.list-group > li.odc-build-run-item')
      .should('have.length.greaterThan', 1);
  }
});

When(
  'user clicks on View logs button for buildrun for workload type {string} from the sidebar',
  (type: string) => {
    if (type === 'Service') {
      cy.get('g.odc-knative-service__label > text').click({ force: true });

      cy.get('div.ocs-sidebar-tabsection:nth-child(6)').should('be.visible');
      cy.get('ul.list-group > li.odc-build-run-item').contains('View logs').click({ force: true });
    } else {
      cy.get('g.pf-topology__node__label > text').click({ force: true });

      cy.get('div.ocs-sidebar-tabsection:nth-child(5)').should('be.visible');
      cy.get('ul.list-group > li.odc-build-run-item').contains('View logs').click({ force: true });
    }
  },
);
