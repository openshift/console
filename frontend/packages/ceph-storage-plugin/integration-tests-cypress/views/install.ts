import { wizard } from '@console/cypress-integration-tests/views/wizard';
import { ServiceAccountKind } from '@console/internal/module/k8s';
import '../../../integration-tests-cypress/support/index.ts';
import { CATALOG, PULL_SECRET_PATH, ocsCatalogSource } from '../mocks/install';
import { NS } from '../utils/consts';
import { commonFlows } from './common';

export const createImagePullSecret = (namespace: string) => {
  cy.log(`Create ${CATALOG.SECRET} in ${namespace}`);
  cy.exec(
    `oc create secret generic ocs-secret --from-file=.dockerconfigjson=${PULL_SECRET_PATH} --type=kubernetes.io/dockerconfigjson -n ${namespace}`,
  );
};

export const createCustomCatalogSource = () => {
  cy.log('Create custom catalog source with latest stable image of OCS');
  cy.exec(`echo '${JSON.stringify(ocsCatalogSource)}' | kubectl apply -f -`);
};

export const subscribeToOperator = () => {
  cy.log('Search in Operator Hub');
  cy.clickNavLink(['Operators', 'OperatorHub']);
  cy.byTestID('search-operatorhub').type('Openshift Container Storage');
  cy.byTestID('ocs-operator-ocs-catalogsource-openshift-marketplace', { timeout: 120000 }).click();
  cy.log('Subscribe to OCS Operator');
  cy.byLegacyTestID('operator-install-btn').click({ force: true });
  cy.byTestID('Operator recommended Namespace:-radio-input').should('be.checked');
  cy.byTestID('install-operator').click();
};

export const linkPullSecretToPods = () => {
  createImagePullSecret(NS);
  cy.log(`Add ${CATALOG.SECRET} to all service accounts in ${NS} namespace`);
  cy.exec(`oc get serviceaccounts -n ${NS} -o json`).then((res) => {
    const { items: saList } = JSON.parse(res.stdout);
    saList.forEach((sa: ServiceAccountKind) => {
      cy.log(`Linking ${CATALOG.SECRET} to ${sa.metadata.name}`);
      cy.exec(`oc secrets link ${sa.metadata.name} ${CATALOG.SECRET} -n ${NS} --for=pull`);
    });
  });
  cy.log(`Rolling out secret update to pods`);
  cy.exec(`oc delete pods --all -n ${NS}`);
};

export const verifyMonitoring = () => {
  cy.log(`Verify monitoring enablement in ${NS} namespace`);
  cy.exec(`oc get project ${NS} -o json`).then((res) => {
    const obj = JSON.parse(res.stdout);
    expect(obj.metadata.labels?.['openshift.io/cluster-monitoring']).toEqual('true');
  });
};

export const verifyNodeLabels = () => {
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
};

export const verifyClusterReadiness = () => {
  // Wait for the storage cluster to reach Ready
  // Storage Cluster CR flickers so wait for 10 seconds
  // Disablng until ocs-operator fixes above issue
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(10000);
  cy.log('Verify Storage cluster is `Ready`');
  cy.byTestID('resource-status').contains('Ready', { timeout: 900000 });
  cy.byLegacyTestID('horizontal-link-Resources').click();
  cy.log('Verify ceph cluster is `Ready`');
  cy.byTestOperandLink('ocs-storagecluster-cephcluster').click();
  cy.byTestID('resource-status').contains('Ready', { timeout: 900000 });
  cy.go('back');
  cy.log('Verify noobaa system is `Ready`');
  cy.byTestOperandLink('noobaa').click();
  cy.byTestID('resource-status').contains('Ready', { timeout: 900000 });
};

export const createInternalStorageCluster = (encrypted: boolean) => {
  const mode = 'Internal';
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
};
