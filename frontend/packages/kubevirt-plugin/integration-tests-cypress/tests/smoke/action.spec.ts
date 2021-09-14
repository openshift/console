import vmiFixture from '../../fixtures/vmi-ephemeral';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, TEMPLATE, VM_STATUS } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { vm, waitForStatus } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `smoke-test-vm-actions-${testName}`,
  namespace: testName,
  template: TEMPLATE.RHEL7,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

const vmiData: VirtualMachineData = {
  name: `smoke-test-vmi-actions-${testName}`,
  namespace: testName,
};

describe('Test VM/VMI actions', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    cy.deleteResource(K8S_KIND.VMI, vmiData.name, vmiData.namespace);
    cy.deleteTestProject(testName);
  });

  describe('Test VM list view action', () => {
    before(() => {
      vm.create(vmData);
      cy.visitVMsList();
      waitForStatus(VM_STATUS.Stopped);
    });

    it('ID(CNV-4013) Starts VM', () => {
      vm.start();
    });

    it('ID(CNV-4014) Restarts VM', () => {
      vm.restart();
    });

    it('ID(CNV-765) Unpauses VM', () => {
      vm.pause();
      vm.unpause();
    });

    it('ID(CNV-4015) Stops VM', () => {
      vm.stop();
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
      waitForStatus(VM_STATUS.Stopped);
    });

    it('ID(CNV-4017) Starts VM', () => {
      vm.start();
    });

    it('ID(CNV-4018) Restarts VM', () => {
      vm.restart();
    });

    it('ID(CNV-1794) Unpauses VM', () => {
      vm.pause();
      vm.unpause();
    });

    it('ID(CNV-4019) Unpauses VM via modal dialog', () => {
      vm.pause();
      waitForStatus(VM_STATUS.Paused);
      cy.get(`button[id=${vmData.namespace}-${vmData.name}-status-edit]`).click();
      cy.byTestID('confirm-action').click();
      waitForStatus(VM_STATUS.Running);
    });

    it('ID(CNV-4020) Stops VM', () => {
      vm.stop();
    });

    it('ID(CNV-4021) Deletes VM', () => {
      vm.delete();
    });
  });

  describe('Test vmi action', () => {
    beforeEach(() => {
      vmiFixture.metadata.name = vmiData.name;
      vmiFixture.metadata.namespace = testName;
      cy.deleteResource(K8S_KIND.VMI, vmiData.name, vmiData.namespace);
      cy.applyResource(vmiFixture);
      cy.visitVMsList();
      waitForStatus(VM_STATUS.Running);
    });

    it('ID(CNV-3693) Test VMI list view action', () => {
      vm.delete();
      cy.byLegacyTestID(vmiData.name).should('not.exist');
    });

    it('ID(CNV-3699) Test VMI detail view action', () => {
      cy.byLegacyTestID(vmiData.name)
        .should('exist')
        .click();
      cy.byLegacyTestID('horizontal-link-Details').click();
      cy.get('.loading-box__loaded').should('be.visible');
      vm.delete();
      cy.byLegacyTestID(vmiData.name).should('not.exist');
    });
  });
});
