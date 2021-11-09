import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { createGitWorkload } from '@console/dev-console/integration-tests/support/pages';
import {
  app,
  navigateTo,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages/app';
import { exportApplication, exportModalButton } from '../../page-objects/export-applications-po';
import { topologyPO } from '../../page-objects/topology-po';
import { exportOfApplication } from '../../pages/export-application/export-applications';
import { topologyHelper, topologyPage } from '../../pages/topology';

Given('user has created a deployment workload {string}', (workloadName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    workloadName,
    'Deployment',
    'nodejs-ex-git-app',
  );
});

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on Export Application button', () => {
  exportOfApplication.exportApplicationFresh();
});

Then('user can see a toast message saying {string}', (message: string) => {
  cy.get(exportApplication.infoTip).contains(message);
});

Then('user can see primer job created in topology', () => {
  topologyHelper.verifyWorkloadInTopologyPage('primer', { timeout: 15000 });
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on Export Application button again', () => {
  topologyPage.verifyWorkloadInTopologyPage('primer');
  cy.get(exportApplication.exportApplicationButton)
    .should('be.visible')
    .click();
});

Then(
  'user can see {string} link, {string}, {string}, and {string} button',
  (el1, el2, el3, el4) => {
    //   To be uncommented after completion of story ODC-6401
    //   cy.get(exportModalButton(el1)).should('be.visible');
    cy.get(exportModalButton(el2)).should('be.visible');
    cy.get(exportModalButton(el3)).should('be.visible');
    cy.get(exportModalButton(el4)).should('be.visible');
    cy.get(exportModalButton('Ok')).click();
  },
);

Given('user has created or selected namespace {string}', (componentName: string) => {
  projectNameSpace.selectOrCreateProject(componentName);
});

Then('user can see Export Application button disabled', () => {
  cy.get(exportApplication.exportApplicationButton).should('be.disabled');
});

Given('Export Application has already started', () => {
  exportOfApplication.exportApplicationFresh();
});

When('user clicks on Restart button', () => {
  cy.get(exportModalButton('Restart Export'))
    .should('be.visible')
    .click();
});

When('user clicks on Cancel button', () => {
  cy.get(exportModalButton('Cancel Export'))
    .should('be.visible')
    .click();
});

Given('user can see primer job gets deleted in topology', () => {
  topologyHelper.search('primer');
  cy.get(topologyPO.highlightNode, { timeout: 10000 }).should('not.exist');
  app.waitForDocumentLoad();
});
