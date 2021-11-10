import { testName } from '../../support';
import { Disk, VirtualMachineData } from '../../types/vm';
import { TEMPLATE, VM_ACTION, VM_ACTION_TIMEOUT, VM_STATUS, K8S_KIND } from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { detailViewAction, selectActionFromDropdown } from '../../views/actions';
import { addDisk, deleteRow } from '../../views/dialog';
import * as tags from '../../views/selector';
import { tab } from '../../views/tab';
import { virtualization } from '../../views/virtualization';
import { vm, waitForStatus, waitForVMStatusLabel } from '../../views/vm';

const pvcName = 'hotplug-test-pvc';

const vmData: VirtualMachineData = {
  name: `hotplug-${testName}`,
  namespace: testName,
  template: TEMPLATE.RHEL6,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const autoHotplugDiskBlank: Disk = {
  description: 'ID(CNV-7271) Attach AutoDetach hotplug disk with [Blank] as source',
  name: 'disk-auto-blank',
  source: ProvisionSource.BLANK,
  size: '2',
  autoDetach: true,
};

const autoHotplugDiskUrl: Disk = {
  description: 'ID(CNV-7272) Attach AutoDetach hotplug disk with [Import via URL] as source',
  name: 'disk-auto-url',
  source: ProvisionSource.URL,
  size: '2',
  autoDetach: true,
};

const autoHotplugDiskReg: Disk = {
  description: 'ID(CNV-7273) Attach AutoDetach hotplug disk with [Import via Registry] as source',
  name: 'disk-auto-reg',
  source: ProvisionSource.REGISTRY,
  size: '2',
  autoDetach: true,
};

const autoHotplugDiskClone: Disk = {
  description: 'ID(CNV-7276) Attach AutoDetach hotplug disk with [Clone existing PVC] as source',
  name: 'disk-auto-clone',
  source: ProvisionSource.CLONE_PVC,
  pvcName,
  pvcNS: testName,
  autoDetach: true,
};

const autoHotplugDiskPVC: Disk = {
  description: 'ID(CNV-7277) Attach AutoDetach hotplug disk with [Use an existing PVC] as source',
  name: 'disk-auto-use',
  source: ProvisionSource.EXISTING,
  pvcName,
  pvcNS: testName,
  autoDetach: true,
};

const persHotplugDiskBlank: Disk = {
  description: 'ID(CNV-7279) Attach Persistent hotplug disk with [Blank] as source',
  name: 'disk-pers-blank',
  source: ProvisionSource.BLANK,
  size: '2',
  autoDetach: false,
};

const persHotplugDiskUrl: Disk = {
  description: 'ID(CNV-7280) Attach Persistent hotplug disk with [Import via URL] as source',
  name: 'disk-pers-url',
  source: ProvisionSource.URL,
  size: '2',
  autoDetach: false,
};

const persHotplugDiskReg: Disk = {
  description: 'ID(CNV-7281) Attach Persistent hotplug disk with [Import via Registry] as source',
  name: 'disk-pers-reg',
  source: ProvisionSource.REGISTRY,
  size: '2',
  autoDetach: false,
};

const persHotplugDiskClone: Disk = {
  description: 'ID(CNV-7281) Attach Persistent hotplug disk with [Clone existing PVC] as source',
  name: 'disk-pers-clone',
  source: ProvisionSource.CLONE_PVC,
  pvcName,
  pvcNS: testName,
  autoDetach: false,
};

const persHotplugDiskPVC: Disk = {
  description: 'ID(CNV-7278) Attach Persistent hotplug disk with [Use an existing PVC] as source',
  name: 'disk-pers-use',
  source: ProvisionSource.EXISTING,
  pvcName,
  pvcNS: testName,
  autoDetach: false,
};

const autoHotplugDisk: Disk = {
  description: '',
  name: 'disk-auto-hotplug',
  size: '2',
  autoDetach: true,
  source: ProvisionSource.BLANK,
};

const persHotplugDisk: Disk = {
  description: '',
  name: 'disk-pers-hotplug',
  size: '2',
  autoDetach: false,
  source: ProvisionSource.BLANK,
};

export const verifyHotplugLabel = (name: string, tag: string) => {
  cy.get(`[data-id="${name}"]`)
    .should('exist')
    .should('contain', tag);
};

export const verifyDiskAttached = (disk: Disk, tag: string) => {
  addDisk(disk);
  verifyHotplugLabel(disk.name, tag);
};

describe('Test UI for VM hotplug disks', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
    cy.createDataVolume(pvcName, testName);
    virtualization.vms.visit();
    vm.create(vmData);
    waitForStatus(VM_STATUS.Running);
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToDisk();
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    cy.deleteResource('Namespace', testName);
  });

  it('ID(CNV-7284) Hotplug disk behavior on VM stop', () => {
    verifyDiskAttached(autoHotplugDisk, 'AutoDetachHotplug');
    verifyDiskAttached(persHotplugDisk, 'PersistingHotplug');
    selectActionFromDropdown(VM_ACTION.Stop, tags.actionButtons.actionDropdownButton);
    cy.get(tags.warningAlert)
      .should('exist')
      .should('contain', autoHotplugDisk.name);
    cy.get(tags.modalConfirm).click();
    waitForVMStatusLabel(VM_STATUS.Stopped, VM_ACTION_TIMEOUT.VM_BOOTUP);
    cy.get(`[data-id="${autoHotplugDisk.name}"]`).should('not.exist');
    cy.get(`[data-id="${persHotplugDisk.name}"]`).should('exist');

    // cleanup
    deleteRow(persHotplugDisk.name);
    cy.get(`[data-id="${persHotplugDisk.name}"]`).should('not.exist');
    detailViewAction(VM_ACTION.Start);
    waitForVMStatusLabel(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
  });

  it('ID(CNV-7285) Hotplug disk behavior on VM restart', () => {
    verifyDiskAttached(autoHotplugDisk, 'AutoDetachHotplug');
    verifyDiskAttached(persHotplugDisk, 'PersistingHotplug');
    selectActionFromDropdown(VM_ACTION.Restart, tags.actionButtons.actionDropdownButton);
    cy.get(tags.warningAlert)
      .should('exist')
      .should('contain', autoHotplugDisk.name);
    cy.get(tags.modalConfirm).click();
    waitForVMStatusLabel(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
    cy.get(`[data-id="${autoHotplugDisk.name}"]`).should('not.exist');
    cy.get(`[data-id="${persHotplugDisk.name}"]`).should('exist');
  });

  [
    persHotplugDiskBlank,
    persHotplugDiskUrl,
    persHotplugDiskReg,
    persHotplugDiskClone,
    persHotplugDiskPVC,
  ].forEach((disk) => {
    it(`${disk.description}`, () => {
      verifyDiskAttached(disk, 'PersistingHotplug');
      deleteRow(disk.name);
      cy.get(`[data-id="${disk.name}"]`).should('not.exist');
    });
  });

  [
    autoHotplugDiskBlank,
    autoHotplugDiskUrl,
    autoHotplugDiskReg,
    autoHotplugDiskClone,
    autoHotplugDiskPVC,
  ].forEach((disk) => {
    it(`${disk.description}`, () => {
      verifyDiskAttached(disk, 'AutoDetachHotplug');
      deleteRow(disk.name);
      cy.get(`[data-id="${disk.name}"]`).should('not.exist');
    });
  });
});
