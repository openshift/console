import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, TEMPLATE, VM_ACTION, VM_ACTION_TIMEOUT, VM_STATUS } from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { Perspective, switchPerspective } from '../../views/dev-perspective';
import { actionButtons, modalConfirm } from '../../views/selector';
import { vm, waitForVMStatusLabel } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `vm-actions-${testName}`,
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: ProvisionSource.REGISTRY,
  sshEnable: false,
  startOnCreation: true,
  optimizeSP: false,
  accessMode: 'ReadWriteMany',
};

const refreshSideBar = (vmItem) => {
  cy.get(vmItem).click();
  cy.byLegacyTestID(actionButtons.actionDropdownButton).should('not.exist');
  cy.get(vmItem).click();
  cy.byLegacyTestID(actionButtons.actionDropdownButton).should('exist');
};

const waitForCompleteStop = (vmItem) => {
  waitForVMStatusLabel(VM_STATUS.Stopped);
  cy.get('.co-m-resource-icon.co-m-resource-node', { timeout: VM_ACTION_TIMEOUT.VM_IMPORT }).should(
    'not.exist',
  );
  if (vmItem) {
    refreshSideBar(vmItem);
  }
};

const waitForCompleteLaunch = (vmItem) => {
  waitForVMStatusLabel(VM_STATUS.Running);
  cy.get('.co-m-resource-icon.co-m-resource-node', { timeout: VM_ACTION_TIMEOUT.VM_IMPORT }).should(
    'exist',
  );
  if (vmItem) {
    refreshSideBar(vmItem);
  }
};

const verifyMigratingVmActions = () => {
  cy.byTestActionID(VM_ACTION.Migrate).should('not.exist');
  cy.byTestActionID(VM_ACTION.Cancel)
    .should('exist')
    .should('not.be.disabled');
  cy.byTestActionID(VM_ACTION.Start).should('not.exist');
  cy.byTestActionID(VM_ACTION.Stop)
    .should('exist')
    .should('not.be.disabled');
  cy.byTestActionID(VM_ACTION.Restart).should('exist');
  cy.byTestActionID(VM_ACTION.Pause)
    .should('exist')
    .should('not.be.disabled');
  cy.contains(VM_ACTION.OpenConsole)
    .should('exist')
    .should('not.be.disabled');
};

const verifyStoppedVmActions = () => {
  cy.byTestActionID(VM_ACTION.Start)
    .should('exist')
    .should('not.be.disabled');
  cy.byTestActionID(VM_ACTION.Stop).should('not.exist');
  cy.byTestActionID(VM_ACTION.Restart).should('not.exist');
  cy.byTestActionID(VM_ACTION.Pause).should('exist');
  cy.byTestActionID(VM_ACTION.Migrate).should('not.exist');
  cy.byTestActionID(VM_ACTION.Cancel).should('not.exist');
  cy.byTestActionID(VM_ACTION.Clone)
    .should('exist')
    .should('not.be.disabled');
  cy.contains(VM_ACTION.OpenConsole).should('exist');
  // .should('be.disabled');
};

const verifyStartingVmActions = () => {
  cy.byTestActionID(VM_ACTION.Start).should('not.exist');
  cy.byTestActionID(VM_ACTION.Stop)
    .should('exist')
    .should('not.be.disabled');
  cy.byTestActionID(VM_ACTION.Restart)
    .should('exist')
    .should('not.be.disabled');
  cy.byTestActionID(VM_ACTION.Pause)
    .should('exist')
    .should('not.be.disabled');
  cy.byTestActionID(VM_ACTION.Migrate).should('exist');
  cy.byTestActionID(VM_ACTION.Cancel).should('not.exist');
  cy.byTestActionID(VM_ACTION.Clone)
    .should('exist')
    .should('not.be.disabled');
  cy.contains(VM_ACTION.OpenConsole)
    .should('exist')
    .should('not.be.disabled');
};

const verifyVmActions = (vmItem) => {
  waitForCompleteLaunch(vmItem);
  cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
  cy.byTestActionID(VM_ACTION.Migrate).click();
  cy.get(modalConfirm).click();
  waitForVMStatusLabel(VM_STATUS.Migrating);
  cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
  verifyMigratingVmActions();
  cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
  waitForCompleteLaunch(vmItem);
  cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
  cy.byTestActionID(VM_ACTION.Stop).click();
  cy.get(modalConfirm).click();
  waitForCompleteStop(vmItem);
  cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
  verifyStoppedVmActions();
  cy.byTestActionID(VM_ACTION.Start).click();
  waitForVMStatusLabel(VM_STATUS.Starting);
  if (vmItem) {
    refreshSideBar(vmItem);
  }
  cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
  verifyStartingVmActions();
};

describe('Test VM actions availability in different VM states', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.visitVMsList();
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      vm.create(vmData, true);
    }
  });

  after(() => {
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      cy.deleteResource(K8S_KIND.VM, vmData.name, testName);
    }
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-7489) VM actions in Virtualization details view', () => {
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      cy.byLegacyTestID(vmData.name).click();
      verifyVmActions('');
    }
  });

  xit('ID(CNV-7488) VM actions in Topology graph view', () => {
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      switchPerspective(Perspective.Developer);
      cy.clickNavLink(['Topology']);
      cy.byLegacyTestID('base-node-handler').click();
      verifyVmActions('[data-test-id="base-node-handler"]');
      switchPerspective(Perspective.Administrator);
    }
  });

  xit('ID(CNV-7487) VM actions in Topology list view', () => {
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      switchPerspective(Perspective.Developer);
      cy.clickNavLink(['Topology']);
      cy.get('[data-test-id="topology-switcher-view"]').click();
      cy.get('.odc-topology-list-view__item-row').click();
      verifyVmActions('.odc-topology-list-view__item-row');
      switchPerspective(Perspective.Administrator);
    }
  });
});
