import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, TEMPLATE, VM_ACTION, VM_STATUS } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { actionButtons, detailsTab, errorAlert } from '../../views/selector';
import { tab } from '../../views/tab';
import { action, vm, waitForStatus } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `test-vm-migration-${testName}`,
  namespace: testName,
  template: TEMPLATE.RHEL8,
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
    cy.visitVMsList();
    waitForStatus(VM_STATUS.Stopped);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-6764) Migrate VM action button is not displayed when VM is off', () => {
    cy.byLegacyTestID(actionButtons.kebabButton).click();
    cy.byTestActionID(VM_ACTION.Migrate).should('not.exist');
    cy.byTestActionID(VM_ACTION.Cancel).should('not.exist');
  });

  it('ID(CNV-2140) Migrate VM action button is displayed when VM is running', () => {
    cy.visitVMsList();
    vm.start();
    cy.byLegacyTestID(actionButtons.kebabButton).click();
    cy.byTestActionID(VM_ACTION.Migrate).should('exist');
    cy.byTestActionID(VM_ACTION.Cancel).should('not.exist');
    cy.contains('Virtualization').click();

    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      cy.byLegacyTestID(vmData.name)
        .should('exist')
        .click();
      tab.navigateToDetails();
      vm.migrate(false);
      waitForStatus(VM_STATUS.Migrating);
      cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
      // TODO: add a check to verify it on kebab button as well
      // https://issues.redhat.com/browse/CNV-14140
      cy.byTestActionID(VM_ACTION.Migrate).should('not.exist');
      cy.byTestActionID(VM_ACTION.Cancel).should('exist');
      cy.contains('Virtual Machine Details').click();
      cy.reload();
      waitForStatus(VM_STATUS.Running);
    }
    if (Cypress.env('STORAGE_CLASS') === 'hostpath-provisioner') {
      vm.migrate(false);
      cy.get(errorAlert)
        .contains('all PVCs must be shared')
        .should('exist');
    }
  });

  it('ID(CNV-2133) Migrate already migrated VM', () => {
    cy.visitVMsList();
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      cy.byLegacyTestID(vmData.name)
        .should('exist')
        .click();
      cy.byLegacyTestID('horizontal-link-Details').click();

      // migrate again
      cy.get(detailsTab.vmNode).then(($node) => {
        const nodeName = $node.text();
        vm.migrate();
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
        vm.migrate(false);
        action(VM_ACTION.Cancel);
        cy.get(detailsTab.vmNode).should(($node1) => {
          const node1 = $node1.text();
          expect(node1).toEqual(node);
        });
      });
    }
  });
});
