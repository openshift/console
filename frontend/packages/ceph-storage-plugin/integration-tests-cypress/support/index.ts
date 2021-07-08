import '../../../integration-tests-cypress/support/index.ts';
import { OCS_OP } from '../consts';
import { CATALOG } from '../mocks/install';
import { NS } from '../utils/consts';
import {
  createImagePullSecret,
  createCustomCatalogSource,
  subscribeToOperator,
  linkPullSecretToPods,
  createInternalStorageCluster,
  verifyMonitoring,
  verifyNodeLabels,
  verifyClusterReadiness,
} from '../views/install';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      install(encrypted?: boolean): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('install', (encrypted = false) => {
  cy.exec(`oc get storagecluster ocs-storagecluster -n ${NS}`, {
    failOnNonZeroExit: false,
  }).then(({ code }) => {
    // Only run Installation if the Storage Cluster doesn't already exist
    if (code !== 0) {
      cy.log('Perform OCS Operator installation and StoargeCluster creation');
      createImagePullSecret(CATALOG.NAMESPACE);
      createCustomCatalogSource();
      subscribeToOperator();
      cy.byTestID('view-installed-operators-btn').click();
      cy.log('Wait for operator phase to be `Installing`');
      cy.byLegacyTestID('item-filter').type(`${OCS_OP}`);
      cy.byTestID('status-text', { timeout: 120000 }).should('have.text', 'Installing');
      /**
       * Waiting for 30 seconds to make sure service accounts are loaded by the operator.
       * It is a safer time lapse to ensure everything is ready for next step.
       * */
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(30000);
      linkPullSecretToPods();
      cy.log('Check operator installation to be successful');
      cy.byTestID('success-icon', { timeout: 180000 }).should('be.visible');
      createInternalStorageCluster(encrypted);
      verifyNodeLabels();
      verifyMonitoring();
      verifyClusterReadiness();
    } else {
      cy.log('OCS Storage Cluster is already Installed. Proceeding without installation.');
    }
  });
});
