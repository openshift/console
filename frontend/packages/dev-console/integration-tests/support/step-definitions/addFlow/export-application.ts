import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '../../constants/global';
import {
  topologyHelper,
  exportApplication,
  exportModalButton,
  createGitWorkloadIfNotExistsOnTopologyPage,
  closeExportNotification,
} from '../../pages';
import { navigateTo } from '../../pages/app';

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

Given('user is at Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user navigates to Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on Export Application option', () => {
  cy.byTestID('item export-application')
    .should('be.visible')
    .click();
});

When('user clicks on Ok button on Export Application modal to start the export', () => {
  cy.get('.modal-body').contains('Do you want to export your application?');
  cy.byTestID('close-btn')
    .should('be.visible')
    .click();
});

When('user clicks on Export Application option again', () => {
  navigateTo(devNavigationMenu.Add);
  cy.byTestID('item export-application')
    .should('be.visible')
    .click();
});

Then('user can see a toast message saying {string}', (message: string) => {
  cy.get(exportApplication.infoTip, { timeout: 5000 }).contains(message);
});

Then(
  'user can see a toast message saying {string} with download option and close button',
  (message: string) => {
    cy.get(exportApplication.infoTip).should('not.exist');
    cy.get(exportApplication.infoTip, { timeout: 120000 }).contains(message);
    cy.byTestID('download-export').contains('Download');
    closeExportNotification();
  },
);

Then('user can see primer deployment created in topology', () => {
  topologyHelper.verifyWorkloadInTopologyPage('primer', { timeout: 80000 });
});

Then(
  'user can see {string} link, {string}, {string}, and {string} button',
  (el1, el2, el3, el4) => {
    cy.get(exportModalButton(el1)).should('be.visible');
    cy.get(exportModalButton(el2)).should('be.visible');
    cy.get(exportModalButton(el3)).should('be.visible');
    cy.get(exportModalButton(el4)).should('be.visible');
    cy.get(exportModalButton('Ok')).click();
  },
);
