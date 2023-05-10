import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { createGitWorkloadIfNotExistsOnTopologyPage } from '@console/dev-console/integration-tests/support/pages';
import {
  app,
  navigateTo,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages/app';
import {
  exportApplication,
  exportModalButton,
  closeExportNotification,
} from '../../page-objects/export-applications-po';
import { topologyPO } from '../../page-objects/topology-po';
import { topologyHelper } from '../../pages/topology';

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
When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on Export Application button', () => {
  cy.get(exportApplication.resourceAddedNotification).should('not.exist');
  cy.get(exportApplication.exportApplicationButton).should('be.visible').click();
});

When('user clicks on Ok button on Export Application modal to start the export', () => {
  cy.get('.modal-body').contains('Do you want to export your application?');
  cy.byTestID('close-btn').should('be.visible').click();
});

Then('user can see a toast message saying {string}', (message: string) => {
  cy.get(exportApplication.infoTip, { timeout: 5000 }).should('include.text', message);
  closeExportNotification();
});

Then(
  'user can see a toast message saying {string} with download option and close button',
  (message: string) => {
    cy.get(exportApplication.infoTip, { timeout: 180000 }).should('include.text', message);
    cy.byTestID('download-export').contains('Download');
    closeExportNotification();
  },
);

Then('user can see primer deployment created in topology', () => {
  topologyHelper.verifyWorkloadInTopologyPage('primer', { timeout: 120000 });
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on Export Application button again', () => {
  cy.get(exportApplication.exportApplicationButton).should('be.visible').click();
  cy.get(exportApplication.exportView, { timeout: 50000 }).should('be.visible');
});

Then(
  'user can see {string} link, {string}, {string}, and {string} button',
  (el1, el2, el3, el4) => {
    cy.get(exportModalButton(el1)).should('be.visible');
    cy.get(exportModalButton(el2)).should('be.visible');
    cy.get(exportModalButton(el3)).should('be.visible');
    cy.get(exportModalButton(el4)).should('be.visible');
    cy.get(exportModalButton('Cancel Export')).click();
    cy.get(exportModalButton('Cancel Export')).should('not.exist');
  },
);

Given('user has created or selected namespace {string}', (componentName: string) => {
  projectNameSpace.selectOrCreateProject(componentName);
});

Then('user can see Export Application button disabled', () => {
  cy.get(exportApplication.exportApplicationButton).should('be.disabled');
});

When('user clicks on Restart button', () => {
  cy.get(exportModalButton('Restart Export')).should('be.visible').click();
});

When('user clicks on Cancel button', () => {
  cy.get(exportModalButton('Cancel Export')).should('be.visible').click();
});

Given('user can see primer job gets deleted in topology', () => {
  topologyHelper.search('primer');
  cy.get(topologyPO.highlightNode, { timeout: 30000 }).should('not.exist');
  app.waitForDocumentLoad();
});
