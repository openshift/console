import { TEMPLATE_NAME, VM_ACTION, VM_ACTION_TIMEOUT, VM_STATUS } from '../../const/index';
import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { actionButtons, detailsTab, errorAlert } from '../../view/selector';
import { tab } from '../../view/tab';
import { virtualization } from '../../view/virtualization';
import { action, vm, waitForStatus } from '../../view/vm';

const vmData: VirtualMachineData = {
  name: `test-vm-migration-${testName}`,
  namespace: testName,
  template: TEMPLATE_NAME,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

describe('Test VM Migration', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    vm.create(vmData);
    virtualization.vms.visit();
    waitForStatus(VM_STATUS.Off);
  });

  after(() => {
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: vmData.name,
        namespace: vmData.namespace,
      },
    });
  });

  it('ID(CNV-6764) Migrate VM action button is not displayed when VM is off', () => {
    cy.byLegacyTestID(actionButtons.kebabButton).click();
    cy.byTestActionID(VM_ACTION.Migrate).should('not.exist');
    cy.byTestActionID(VM_ACTION.Cancel).should('not.exist');
  });

  it('ID(CNV-2140) Migrate VM action button is displayed when VM is running', () => {
    virtualization.vms.visit();
    vm.start(vmData);
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToDetails();
    cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
    cy.contains('Migrate Virtual Machine').should('exist');
    cy.byTestActionID(VM_ACTION.Cancel).should('not.exist');

    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      vm.migrate(vmData, false);
      cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
      cy.contains('Migrate Virtual Machine').should('not.exist');
      cy.byTestActionID(VM_ACTION.Cancel).should('exist');
      waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_MIGRATE);
    }
    if (Cypress.env('STORAGE_CLASS') === 'hostpath-provisioner') {
      vm.migrate(vmData, false);
      cy.get(errorAlert)
        .contains('all PVCs must be shared')
        .should('exist');
    }
  });

  it('ID(CNV-2133) Migrate already migrated VM', () => {
    virtualization.vms.visit();
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      cy.byLegacyTestID(vmData.name)
        .should('exist')
        .click();
      cy.byLegacyTestID('horizontal-link-Details').click();

      // migrate again
      cy.get(detailsTab.vmNode).then(($node) => {
        const nodeName = $node.text();
        vm.migrate(vmData);
        cy.get(detailsTab.vmNode).should(($node1) => {
          const nodeName1 = $node1.text();
          expect(nodeName1).not.toEqual(nodeName);
        });
      });
    }
  });

  it('ID(CNV-2132) Cancel ongoing VM migration', () => {
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      cy.get(detailsTab.vmNode).then(($node) => {
        const node = $node.text();
        vm.migrate(vmData, false);
        action(VM_ACTION.Cancel);
        cy.get(detailsTab.vmNode).should(($node1) => {
          const node1 = $node1.text();
          expect(node1).toEqual(node);
        });
      });
    }
  });
});
