import { testName } from '../../support';
import { Disk, VirtualMachineData } from '../../types/vm';
import {
  DISK_SOURCE,
  TEMPLATE_NAME,
  VM_ACTION,
  VM_ACTION_TIMEOUT,
  VM_STATUS,
} from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import {
  detailViewAction,
  selectActionFromDropdown,
  detailViewDropdown,
} from '../../views/actions';
import { addDisk, deleteDisk } from '../../views/dialog';
import * as tags from '../../views/selector';
import { tab } from '../../views/tab';
import { virtualization } from '../../views/virtualization';
import { vm, waitForStatus, waitForVMStatusLabel } from '../../views/vm';

const pvcName = 'hotplug-test-pvc';

const vmData: VirtualMachineData = {
  name: `hotplug-${testName}`,
  namespace: testName,
  template: TEMPLATE_NAME,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const autoHotplugDiskBlank: Disk = {
  description: 'ID(CNV-6856) Attach AutoDetach hotplug disk with [Blank] as source to running VM',
  name: 'disk-auto-blank',
  provisionSource: ProvisionSource.BLANK,
  size: '2',
  autoDetach: true,
  source: DISK_SOURCE.Blank,
};

const autoHotplugDiskUrl: Disk = {
  description:
    'ID(CNV-6855) Attach AutoDetach hotplug disk with [Import via URL] as source selection to running VM',
  name: 'disk-auto-url',
  provisionSource: ProvisionSource.URL,
  size: '2',
  autoDetach: true,
  source: DISK_SOURCE.Url,
};

const autoHotplugDiskReg: Disk = {
  description:
    'ID(CNV-6859) Attach AutoDetach hotplug disk with [Import via Registry] to running VM',
  name: 'disk-auto-reg',
  provisionSource: ProvisionSource.REGISTRY,
  size: '2',
  autoDetach: true,
  source: DISK_SOURCE.Container,
};

const autoHotplugDiskClone: Disk = {
  description:
    'ID(CNV-6858) Attach AutoDetach hotplug disk with [Clone existing PVC] to running VM',
  name: 'disk-auto-clone',
  provisionSource: ProvisionSource.CLONE_PVC,
  pvcName,
  pvcNS: testName,
  autoDetach: true,
  source: DISK_SOURCE.AttachClonedDisk,
};

const autoHotplugDiskPVC: Disk = {
  description:
    'ID(CNV-6857) Attach AutoDetach hotplug disk with [Use an existing PVC] as source selection to running VM',
  name: 'disk-auto-use',
  provisionSource: ProvisionSource.EXISTING,
  pvcName,
  pvcNS: testName,
  autoDetach: true,
  source: DISK_SOURCE.AttachDisk,
};

const persHotplugDiskBlank: Disk = {
  description: 'ID(CNV-6828) Attach Persistent hotplug disk with [Blank] as source to running VM',
  name: 'disk-pers-blank',
  provisionSource: ProvisionSource.BLANK,
  size: '2',
  autoDetach: false,
  source: DISK_SOURCE.Blank,
};

const persHotplugDiskUrl: Disk = {
  description:
    'ID(CNV-6860) Attach Persistent hotplug disk with [Import via URL] as source to running VM',
  name: 'disk-pers-url',
  provisionSource: ProvisionSource.URL,
  size: '2',
  autoDetach: false,
  source: DISK_SOURCE.Url,
};

const persHotplugDiskReg: Disk = {
  description:
    'ID(CNV-6863) Attach Persistent hotplug disk with [Import via Registry] as source to running VM',
  name: 'disk-pers-reg',
  provisionSource: ProvisionSource.REGISTRY,
  size: '2',
  autoDetach: false,
  source: DISK_SOURCE.Container,
};

const persHotplugDiskClone: Disk = {
  description:
    'ID(CNV-6862) Attach Persistent hotplug disk with [Clone existing PVC] as source to running VM',
  name: 'disk-pers-clone',
  provisionSource: ProvisionSource.CLONE_PVC,
  pvcName,
  pvcNS: testName,
  autoDetach: false,
  source: DISK_SOURCE.AttachClonedDisk,
};

const persHotplugDiskPVC: Disk = {
  description:
    'ID(CNV-6861) Attach Persistent hotplug disk with [Use an existing PVC] as source to running VM',
  name: 'disk-pers-use',
  provisionSource: ProvisionSource.EXISTING,
  pvcName,
  pvcNS: testName,
  autoDetach: false,
  source: DISK_SOURCE.AttachDisk,
};

const autoHotplugDisk: Disk = {
  description: '',
  name: 'disk-auto-hotplug',
  size: '2',
  autoDetach: true,
  source: DISK_SOURCE.Blank,
};

const persHotplugDisk: Disk = {
  description: '',
  name: 'disk-pers-hotplug',
  size: '2',
  autoDetach: false,
  source: DISK_SOURCE.Blank,
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

describe('Test UI for VM disk hot-plug', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
    cy.createDataVolume(pvcName, testName);
    virtualization.vms.visit();
    vm.create(vmData);
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT);
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToDisk();
  });

  after(() => {
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: vmData.name,
        namespace: vmData.namespace,
      },
    });
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  it('ID(CNV-6833) Persistent hotplug disk is not detached on VM stop/restart', () => {
    verifyDiskAttached(persHotplugDisk, 'PersistingHotplug');
    detailViewAction(VM_ACTION.Stop);
    waitForVMStatusLabel(VM_STATUS.Stopped, VM_ACTION_TIMEOUT.VM_BOOTUP);
    cy.get(`[data-id="${persHotplugDisk.name}"]`).should('exist');
    detailViewAction(VM_ACTION.Start);
    waitForVMStatusLabel(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
  });

  it('ID(CNV-6839) Detach hotplug disk from running VM', () => {
    verifyDiskAttached(autoHotplugDisk, 'AutoDetachHotplug');
    deleteDisk(autoHotplugDisk.name);
    cy.get(`[data-id="${autoHotplugDisk.name}"]`).should('not.exist');
  });

  it('ID(CNV-6834) AutoDetach hotplug disk is detached on VM stop with notification', () => {
    verifyDiskAttached(autoHotplugDisk, 'AutoDetachHotplug');
    selectActionFromDropdown(VM_ACTION.Stop, detailViewDropdown);
    cy.get(tags.alertDescr)
      .should('exist')
      .should('contain', autoHotplugDisk.name);
    cy.get(tags.modalConfirm).click();
    waitForVMStatusLabel(VM_STATUS.Stopped, VM_ACTION_TIMEOUT.VM_BOOTUP);
    cy.get(`[data-id="${autoHotplugDisk.name}"]`).should('not.exist');

    // cleanup
    detailViewAction(VM_ACTION.Start);
    waitForVMStatusLabel(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
  });

  it('ID(CNV-6750) AutoDetach hotplug disk is detached on VM restart with notification', () => {
    verifyDiskAttached(autoHotplugDisk, 'AutoDetachHotplug');
    selectActionFromDropdown(VM_ACTION.Restart, detailViewDropdown);
    cy.get(tags.alertDescr)
      .should('exist')
      .should('contain', autoHotplugDisk.name);
    cy.get(tags.modalConfirm).click();
    waitForVMStatusLabel(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
    cy.get(`[data-id="${autoHotplugDisk.name}"]`).should('not.exist');
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
    });
  });
});
