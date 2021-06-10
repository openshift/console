import { testName } from '../../support';
import { TEMPLATE_NAME, VM_STATUS } from '../../const/index';
import { virtualization } from '../../view/virtualization';
import { VirtualMachineData } from '../../types/vm';
import { ProvisionSource } from '../../enums/provisionSource';
import { vm, waitForStatus } from '../../view/vm';

const vmData: VirtualMachineData = {
  name: `smoke-test-vm-actions-${testName}`,
  namespace: testName,
  template: TEMPLATE_NAME,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

describe('Test VM/VMI actions', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
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

  describe('Test VM list view action', () => {
    before(() => {
      vm.create(vmData);
      virtualization.vms.visit();
      waitForStatus(VM_STATUS.Off);
    });

    it('ID(CNV-4013) Starts VM', () => {
      vm.start(vmData);
    });

    it('ID(CNV-4014) Restarts VM', () => {
      vm.restart(vmData);
    });

    it('ID(CNV-765) Unpauses VM', () => {
      cy.pauseVM(vmData);
      vm.unpause(vmData);
    });

    it('ID(CNV-4015) Stops VM', () => {
      vm.stop(vmData);
    });

    it('ID(CNV-4016) Deletes VM', () => {
      vm.delete();
    });
  });

  describe('Test VM detail view action', () => {
    before(() => {
      vm.create(vmData);
      cy.byLegacyTestID(vmData.name)
        .should('exist')
        .click();
      cy.byLegacyTestID('horizontal-link-Details').click();
      waitForStatus(VM_STATUS.Off);
    });

    it('ID(CNV-4017) Starts VM', () => {
      vm.start(vmData);
    });

    it('ID(CNV-4018) Restarts VM', () => {
      vm.restart(vmData);
    });

    it('ID(CNV-1794) Unpauses VM', () => {
      cy.pauseVM(vmData);
      vm.unpause(vmData);
    });

    it('ID(CNV-4019) Unpauses VM via modal dialog', () => {
      cy.pauseVM(vmData);
      waitForStatus(VM_STATUS.Paused);
      cy.get(`button[id=${vmData.namespace}-${vmData.name}-status-edit]`).click();
      cy.byTestID('confirm-action').click();
      waitForStatus(VM_STATUS.Running, vmData);
    });

    it('ID(CNV-4020) Stops VM', () => {
      vm.stop(vmData);
    });

    it('ID(CNV-4021) Deletes VM', () => {
      vm.delete();
    });
  });

  describe('Test vmi action', () => {
    const vmiData: VirtualMachineData = {
      name: 'vmi-ephemeral',
      namespace: testName,
    };

    beforeEach(() => {
      cy.fixture('vmi-ephemeral').then((vmi) => {
        vmi.metadata.namespace = testName;
        cy.createResource(vmi);
      });
      virtualization.vms.visit();
      waitForStatus(VM_STATUS.Running, vmiData);
    });

    it('ID(CNV-3693) Test VMI list view action', () => {
      vm.delete();
      cy.byLegacyTestID('vmi-ephemeral').should('not.exist');
    });

    it('ID(CNV-3699) Test VMI detail view action', () => {
      cy.byLegacyTestID('vmi-ephemeral')
        .should('exist')
        .click();
      cy.byLegacyTestID('horizontal-link-Details').click();
      cy.get('.loading-box__loaded').should('be.visible');
      vm.delete();
      cy.byLegacyTestID('vmi-ephemeral').should('not.exist');
    });
  });
});
