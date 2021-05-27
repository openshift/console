import * as _ from 'lodash';
import '../../../integration-tests-cypress/support/index.ts';
import { wizard } from '../../../integration-tests-cypress/views/wizard';
import { commonFlows } from '../views/common';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      install(mode?: 'Internal' | 'Attached', encrypted?: boolean): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('install', (mode: 'Internal' | 'Attached' = 'Internal', encrypted = false) => {
  cy.exec('oc get storagecluster ocs-storagecluster -n openshift-storage', {
    failOnNonZeroExit: false,
  }).then(({ code }) => {
    // Only run Installation if the Storage Cluster doesn't already exist
    if (code !== 0) {
      cy.log('Perform OCS Installation and cluster creation');
      cy.log('Search in Operator Hub');
      cy.clickNavLink(['Operators', 'OperatorHub']);
      cy.byTestID('search-operatorhub').type('Openshift Container Storage');
      cy.byTestID('ocs-operator-redhat-operators-openshift-marketplace').click();

      cy.log('Subscribe to OCS Operator');
      cy.byLegacyTestID('operator-install-btn').click({ force: true });
      cy.byTestID('stable-4.6-radio-input').click();
      cy.byTestID('Operator recommended Namespace:-radio-input').should('be.checked');
      cy.byTestID('install-operator').click();
      cy.byTestID('success-icon', { timeout: 180000 }).should('be.visible');

      // Rook, Noobaa and OCS pod should come up after installation.
      cy.exec('oc get po -n openshift-storage -o json').then((res) => {
        const { items } = JSON.parse(res.stdout);
        expect(
          items.find((item) => _.startsWith(item.metadata.name, 'noobaa-operator')),
        ).toBeDefined();
        expect(
          items.find((item) => _.startsWith(item.metadata.name, 'ocs-operator')),
        ).toBeDefined();
        expect(
          items.find((item) => _.startsWith(item.metadata.name, 'rook-ceph-operator')),
        ).toBeDefined();
      });

      // Make changes to this once we add annotation
      cy.log(`Install OCS in ${mode} Mode`);
      // Reload because StorageCluster CRD is not registered in the UI; hence getting 404 Error
      cy.visit('/');
      cy.reload(true);
      commonFlows.navigateToOCS();
      cy.byLegacyTestID('horizontal-link-Storage Cluster').click();
      cy.byTestID('item-create').click();

      cy.log(`Select ${mode}`);
      cy.byTestID('Internal-radio-input').should('be.checked');

      // Step 1
      // Select all worker Nodes
      commonFlows.checkAll().check();
      commonFlows.checkAll().should('be.checked');
      // Two dropdowns in the same page.
      // (Todo: )make dropdown data-test-id be something that can be passed as a prop
      cy.byLegacyTestID('dropdown-button')
        .first()
        .click();
      cy.byTestDropDownMenu('512Gi').click();
      wizard.next();

      // Step 2
      if (encrypted) {
        cy.log('Enabling Encryption');
        cy.byTestID('encryption-checkbox').click();
      }
      wizard.next();

      // Final Step
      wizard.create();

      cy.log('Verify all worker nodes are labelled');
      cy.exec('oc get nodes -o json').then((res) => {
        const { items } = JSON.parse(res.stdout);
        items
          .map((item) => item.metadata.labels)
          .filter((item) => item.hasOwnProperty('node-role.kubernetes.io/worker'))
          .forEach((item) =>
            expect(item.hasOwnProperty('cluster.ocs.openshift.io/openshift-storage')).toBeTruthy(),
          );
      });

      // Wait for the storage cluster to reach Ready
      // Storage Cluster CR flickers so wait for 10 seconds
      // Disablng until ocs-operator fixes above issue
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000);
      cy.byTestID('resource-status').contains('Ready', { timeout: 900000 });
    } else {
      cy.log('OCS Storage Cluster is already Installed. Proceeding without installation');
    }
  });
});
