import '../../../integration-tests-cypress/support/index.ts';
import { ODF_OP, STORAGE_SYSTEM_NAME, OCS_SC_STATE, ODF_CONSOLE_STATE } from '../consts';
import { CATALOG } from '../mocks/install';
import { NS } from '../utils/consts';
import {
  patchOperatorHubConfig,
  createImagePullSecret,
  createCustomCatalogSource,
  subscribeToOperator,
  linkPullSecretToPods,
} from '../views/install';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      install(): Chainable<Element>;
    }
  }
}

const installODFOperator = () => {
  cy.log('Perform ODF Operator installation and StoargeSystem creation');
  patchOperatorHubConfig();
  createImagePullSecret(CATALOG.NAMESPACE);
  createCustomCatalogSource();
  subscribeToOperator();
  cy.byTestID('view-installed-operators-btn').click();
  cy.log('Wait for operator phase to be `Installing`');
  cy.byLegacyTestID('item-filter').type(`${ODF_OP}`);
  cy.byTestID('status-text', { timeout: 120000 }).should('have.text', 'Installing');
  // Waiting for sometime to make sure service accounts are loaded by the operator.
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(30000);
  linkPullSecretToPods();
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(30000);
  linkPullSecretToPods(false);
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(120000);
  linkPullSecretToPods(false);
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(120000);
  cy.log('Check operator installation to be successful');
  cy.byTestID('success-icon', { timeout: 360000 }).should('be.visible');
};

const createStorageSystem = () => {
  cy.byTestRows('resource-row')
    .get('td')
    .first()
    .click();
  cy.byLegacyTestID('horizontal-link-Storage System').click();
  cy.byTestID('item-create').click();
  // Wait for the StorageSystem page to load.
  cy.contains('Create StorageSystem', { timeout: 10 * 1000 }).should('be.visible');
  cy.get('button')
    .contains('Next')
    .click();
  cy.get('input[type="checkbox"]')
    .first()
    .uncheck();
  cy.get('table')
    .get('input[type="checkbox"]')
    .first()
    .check();
  cy.get('button')
    .contains('Next')
    .click();
  cy.get('button')
    .contains('Next')
    .click();
  cy.get('button')
    .contains('Create StorageSystem')
    .as('Create StorageSystem Button');
  cy.get('@Create StorageSystem Button').click();
  // Wait for the storage system to be created.
  cy.get('@Create StorageSystem Button', { timeout: 10 * 1000 }).should('not.exist');
  cy.log('Check if storage system was created');
  cy.clickNavLink(['Operators', 'Installed Operators']);
  cy.byLegacyTestID('item-filter').type('Openshift Data Foundation');
  cy.byTestRows('resource-row')
    .get('td')
    .first()
    .click();
  cy.byLegacyTestID('horizontal-link-Storage System').click();
  cy.byLegacyTestID('item-filter').type(`${STORAGE_SYSTEM_NAME}`);
  cy.get('td[role="gridcell"]', { timeout: 5 * 60000 }).contains('Available');
  cy.exec(OCS_SC_STATE, { timeout: 25 * 60000 });
};

Cypress.Commands.add('install', () => {
  cy.exec(`oc get storagesystem ocs-storagecluster-storagesystem -n ${NS}`, {
    failOnNonZeroExit: false,
  }).then(({ code }) => {
    // Only run Installation if the Storage System doesn't already exist
    if (code !== 0) {
      installODFOperator();
      cy.log('Waiting for odf-plugin to be in running phase');
      cy.exec(ODF_CONSOLE_STATE, { timeout: 2 * 60000 });
      cy.log('Reloading after operator install in successful, to load odf-plugin.');
      cy.reload(true);
      cy.log('Check operator installation to be successful, after reload');
      cy.byTestID('success-icon', { timeout: 180000 }).should('be.visible');
      createStorageSystem();
    } else {
      cy.log('ODF Storage System is already Installed. Proceeding without installation.');
    }
  });
});
