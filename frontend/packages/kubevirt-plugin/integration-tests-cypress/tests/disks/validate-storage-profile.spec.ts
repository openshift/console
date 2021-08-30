import { listPage } from '@console/cypress-integration-tests/views/list-page';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { TEMPLATE_NAME } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `validate-storage-profile-${testName}`,
  namespace: testName,
  template: TEMPLATE_NAME,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      createStorageClass(): void;
      deleteStorageClass(): void;
      deleteStorageProfile(): void;
      editStorageProfile(): void;
      validateSPSettings(): void;
    }
  }
}

Cypress.Commands.add('createStorageClass', () => {
  cy.log('Create StorageClass resource');
  cy.exec(`
cat << EOF | kubectl apply -f -
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fake-example-storagecluster
  annotations:
    description: Provides RWO and RWX Filesystem volumes
provisioner: fake.example.com
reclaimPolicy: Delete
allowVolumeExpansion: true
  `);
});

Cypress.Commands.add('deleteStorageClass', () => {
  cy.log('Delete StorageClass resource');
  cy.exec(`kubectl delete storageclasses fake-example-storagecluster`);
});

Cypress.Commands.add('deleteStorageProfile', () => {
  cy.log('Delete StorageProfile resource');
  cy.exec(`kubectl delete storageprofiles fake-example-storagecluster`);
});

Cypress.Commands.add('editStorageProfile', () => {
  cy.log('Edit StorageProfile resource');
  cy.exec(`
cat << EOF | kubectl apply -f -
---
apiVersion: cdi.kubevirt.io/v1beta1
kind: StorageProfile
metadata:
  generation: 1
  labels:
    app: containerized-data-importer
    cdi.kubevirt.io: ""
  name: fake-example-storagecluster
spec:
  claimPropertySets:
    - accessModes:
        - ReadWriteMany
      volumeMode: Block
status:
  provisioner: fake.example.com
  storageClass: fake-example-storagecluster
  `);
});

Cypress.Commands.add('validateSPSettings', () => {
  cy.byTestID('storage-class-dropdown').click();
  cy.contains('fake-example-storagecluster').click();
  cy.byTestID('apply-storage-provider').should('be.enabled');
  cy.contains('ReadWriteMany').should('be.visible');
  cy.contains('Block').should('be.visible');
});

describe('ID(CNV-6923) Verify storageProfile with a fake storageClass', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.createStorageClass(); // ensure SC existence
    cy.editStorageProfile(); // ensure SP has default properties for AccessMode and VolumeMode
    vm.create(vmData);
    virtualization.vms.visit();
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
  });

  after(() => {
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: vmData.name,
        namespace: vmData.namespace,
      },
    });
    cy.deleteStorageClass();
    cy.deleteStorageProfile();
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  it('ID(CNV-6922) Verify storageProfile in add disk modal', () => {
    cy.byLegacyTestID('horizontal-link-Disks').click();
    cy.byTestID('item-create').click();
    cy.validateSPSettings();
    cy.byLegacyTestID('modal-cancel-action').click();
  });
  it('ID(CNV-6921) Verify storageProfile in template add boot source modal', () => {
    virtualization.templates.visit();
    listPage.rows.shouldBeLoaded();
    cy.get('[data-test-template-name="rhel8-server-small"]')
      .contains('Add source')
      .click();
    cy.contains('Advanced Storage settings').click();
    cy.validateSPSettings();
    cy.byLegacyTestID('modal-cancel-action').click();
  });
  it('ID(CNV-6920) Verify storageProfile in upload PVC form', () => {
    cy.visit(`/k8s/ns/${testName}/persistentvolumeclaims`);
    listPage.rows.shouldBeLoaded();
    cy.byTestID('item-create').click();
    cy.contains('With Data upload form').click();
    cy.validateSPSettings();
    cy.contains('Cancel').click();
  });
});
