import { checkErrors } from '../../../integration-tests-cypress/support';
import { getPVCJSON } from '../helpers/pvc';

describe('Check OCS Dashboards', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
    cy.visit('/ocs-dashboards');
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('Check Status Card is in Healthy', () => {
    cy.log('Check if OCS Cluster is Healthy');
    cy.byTestID('success-icon')
      .first()
      .should('be.visible');
    cy.log('Check if Data Resiliency is Healthy');
    cy.byTestID('success-icon')
      .last()
      .should('be.visible');
  });

  it('Check Details card is correct', () => {
    cy.contains('OpenShift Container Storage').should('be.visible');
    cy.contains('ocs-storagecluster').should('be.visible');
  });

  it('Check Inventory card is correct', () => {
    cy.log('Check the total number of OCS nodes');
    cy.get('.skeleton-activity').should('not.exist');
    cy.byTestID('inventory-nodes')
      .invoke('text')
      .then((text) => {
        cy.exec(
          `oc get nodes -l cluster.ocs.openshift.io/openshift-storage -o json | jq '.items | length'`,
        ).then(({ stdout }) => {
          expect(text).toEqual(`${stdout.trim()} Nodes`);
        });
      });

    cy.log('Check that number of PVCs and PVs is updated after sucessful PVC creation');
    cy.byTestID('inventory-pvc')
      .invoke('text')
      .then((pvcText) => {
        const [numberPVC] = pvcText.split(' ');
        const initialPVC = Number(numberPVC);
        cy.exec(
          ` echo '${JSON.stringify(
            getPVCJSON('dummy-pvc', 'openshift-storage', 'ocs-storagecluster-ceph-rbd', '5Gi'),
          )}' | oc create -f -`,
        ).then(() => {
          cy.byTestID('inventory-pvc').contains(
            `${(initialPVC + 1).toString()} PersistentVolumeClaims`,
          );
          cy.byTestID('inventory-pv').contains(`${(initialPVC + 1).toString()} PersistentVolumes`);
        });
      });
  });
});
