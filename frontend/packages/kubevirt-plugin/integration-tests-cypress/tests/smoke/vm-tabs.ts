import { TEMPLATE_NAME, VM_ACTION_TIMEOUT, VM_STATUS } from '../../const/index';
import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { virtualization } from '../../view/virtualization';
import { waitForStatus, vm } from '../../view/vm';

const vmData: VirtualMachineData = {
  name: `smoke-test-vm-${testName}`,
  namespace: testName,
  template: TEMPLATE_NAME,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

describe('smoke tests', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    vm.create(vmData);
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

  describe('visit vm list page', () => {
    it('vm list page is loaded', () => {
      virtualization.vms.visit();
      cy.byLegacyTestID(vmData.name).should('exist');
    });
  });

  describe('visit vm tabs', () => {
    before(() => {
      cy.byLegacyTestID(vmData.name)
        .should('exist')
        .click();
    });

    it('vm overview tab is loaded', () => {
      cy.get('.co-dashboard-card__title').should('exist');
    });

    it('vm details tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Details').click();
      cy.contains('Virtual Machine Details').should('be.visible');
      waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_BOOTUP);
    });

    it('vm yaml tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-public~YAML').click();
      cy.get('.yaml-editor').should('be.visible');
    });

    it('vm environment tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Environment').click();
      cy.contains('Add Config Map, Secret or Service Account').should('be.visible');
    });

    it('vm events tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-public~Events').click();
      cy.get('.co-sysevent-stream').should('be.visible');
    });

    it('vm console tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Console').click();
      cy.get('.loading-box__loaded').should('be.visible');
    });

    it('vm network tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Network Interfaces').click();
      cy.get('button[id="add-nic"]').should('be.visible');
    });

    it('vm disk tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Disks').click();
      cy.get('button[id="add-disk"]').should('be.visible');
    });

    it('vm snapshot tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Snapshots').click();
      cy.get('button[id="add-snapshot"]').should('be.visible');
    });
  });

  describe('visit vm/vmi tabs', () => {
    before(() => {
      cy.visit(`/k8s/ns/${testName}/virtualmachineinstances/${vmData.name}`);
    });

    it('vm/vmi overview tab is loaded', () => {
      cy.get('.co-dashboard-card__title').should('exist');
    });

    it('vm/vmi details tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Details').click();
      cy.contains('Virtual Machine Instance Details').should('be.visible');
    });

    it('vm/vmi yaml tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-public~YAML').click();
      cy.get('.yaml-editor').should('be.visible');
    });

    it('vm/vmi events tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-public~Events').click();
      cy.get('.co-sysevent-stream').should('be.visible');
    });

    it('vm/vmi console tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Console').click();
      cy.get('.loading-box__loaded').should('be.visible');
    });

    it('vm/vmi network tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Network Interfaces').click();
      cy.get('.loading-box__loaded').should('be.visible');
    });

    it('vm/vmi disk tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Disks').click();
      cy.get('.loading-box__loaded').should('be.visible');
    });
  });
});
