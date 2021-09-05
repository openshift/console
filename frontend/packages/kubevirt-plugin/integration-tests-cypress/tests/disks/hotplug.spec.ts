import { testName } from '../../support';
import { Disk, VirtualMachineData } from '../../types/vm';
import { VM_ACTION, VM_STATUS, TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { detailViewAction } from '../../views/actions';
import { addDisk, delDisk } from '../../views/dialog';
import * as tags from '../../views/selector';
import { tab } from '../../views/tab';
import { virtualization } from '../../views/virtualization';
import { vm, waitForStatus } from '../../views/vm';

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
  description: 'ID(CNV-6856) Attach AutoDetach hotplug disk with [Blank] as source to running VM',
  name: 'disk-auto-blank',
  source: ProvisionSource.BLANK,
  size: '2',
  autoDetach: true,
};

const autoHotplugDiskUrl: Disk = {
  description:
    'ID(CNV-6855) Attach AutoDetach hotplug disk with [Import via URL] as source selection to running VM',
  name: 'disk-auto-url',
  source: ProvisionSource.URL,
  size: '2',
  autoDetach: true,
};

const autoHotplugDiskReg: Disk = {
  description:
    'ID(CNV-6859) Attach AutoDetach hotplug disk with [Import via Registry] to running VM',
  name: 'disk-auto-reg',
  source: ProvisionSource.REGISTRY,
  size: '2',
  autoDetach: true,
};

const autoHotplugDiskClone: Disk = {
  description:
    'ID(CNV-6858) Attach AutoDetach hotplug disk with [Clone existing PVC] to running VM',
  name: 'disk-auto-clone',
  source: ProvisionSource.CLONE_PVC,
  pvcName,
  pvcNS: testName,
  autoDetach: true,
};

const autoHotplugDiskPVC: Disk = {
  description:
    'ID(CNV-6857) Attach AutoDetach hotplug disk with [Use an existing PVC] as source selection to running VM',
  name: 'disk-auto-use',
  source: ProvisionSource.EXISTING,
  pvcName,
  pvcNS: testName,
  autoDetach: true,
};

const persHotplugDiskBlank: Disk = {
  description: 'ID(CNV-6828) Attach Persistent hotplug disk with [Blank] as source to running VM',
  name: 'disk-pers-blank',
  source: ProvisionSource.BLANK,
  size: '2',
  autoDetach: false,
};

const persHotplugDiskUrl: Disk = {
  description:
    'ID(CNV-6860) Attach Persistent hotplug disk with [Import via URL] as source to running VM',
  name: 'disk-pers-url',
  source: ProvisionSource.URL,
  size: '2',
  autoDetach: false,
};

const persHotplugDiskReg: Disk = {
  description:
    'ID(CNV-6863) Attach Persistent hotplug disk with [Import via Registry] as source to running VM',
  name: 'disk-pers-reg',
  source: ProvisionSource.REGISTRY,
  size: '2',
  autoDetach: false,
};

const persHotplugDiskClone: Disk = {
  description:
    'ID(CNV-6862) Attach Persistent hotplug disk with [Clone existing PVC] as source to running VM',
  name: 'disk-pers-clone',
  source: ProvisionSource.CLONE_PVC,
  pvcName,
  pvcNS: testName,
  autoDetach: false,
};

const persHotplugDiskPVC: Disk = {
  description:
    'ID(CNV-6861) Attach Persistent hotplug disk with [Use an existing PVC] as source to running VM',
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

const autoHotplugDisk1: Disk = {
  description: '',
  name: 'disk-auto-hotplug1',
  size: '2',
  autoDetach: true,
  source: ProvisionSource.BLANK,
};

const autoHotplugDisk2: Disk = {
  description: '',
  name: 'disk-auto-hotplug2',
  size: '2',
  autoDetach: true,
  source: ProvisionSource.BLANK,
};

const autoHotplugDisk3: Disk = {
  description: '',
  name: 'disk-auto-hotplug3',
  size: '2',
  autoDetach: true,
  source: ProvisionSource.BLANK,
};

const autoHotplugDisk4: Disk = {
  description: '',
  name: 'disk-auto-hotplug4',
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

const persHotplugDisk1: Disk = {
  description: '',
  name: 'disk-pers-hotplug1',
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

describe('Test UI for VM disk hot-plug', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
    cy.createDataVolume(pvcName, testName);
    virtualization.vms.visit();
    vm.create(vmData);
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

  it('ID(CNV-6833) Persistent hotplug disk is not detached on VM stop', () => {
    verifyDiskAttached(persHotplugDisk1, 'PersistingHotplug');
    detailViewAction(VM_ACTION.Stop);
    waitForStatus(VM_STATUS.Stopped);
    cy.get(`[data-id="${persHotplugDisk1.name}"]`).should('exist');
    detailViewAction(VM_ACTION.Start);
    waitForStatus(VM_STATUS.Running);
  });

  it('ID(CNV-6749) Persistent hotplug disk is not detached on VM restart', () => {
    verifyDiskAttached(persHotplugDisk, 'PersistingHotplug');
    detailViewAction(VM_ACTION.Restart);
    waitForStatus(VM_STATUS.Starting);
    waitForStatus(VM_STATUS.Running);
    cy.get(`[data-id="${persHotplugDisk.name}"]`).should('exist');
  });

  it('ID(CNV-6839) Detach hotplug disk from running VM', () => {
    verifyDiskAttached(autoHotplugDisk1, 'AutoDetachHotplug');
    delDisk(autoHotplugDisk1.name);
    cy.get(`[data-id="${autoHotplugDisk1.name}"]`).should('not.exist');
  });

  it('ID(CNV-6832) Notification about AutoDetach disks is displayed on VM restart', () => {
    verifyDiskAttached(autoHotplugDisk2, 'AutoDetachHotplug');
    detailViewAction(VM_ACTION.Restart);
    cy.get(tags.alertDescr)
      .should('exist')
      .should('contain', autoHotplugDisk2.name);
    cy.get(tags.modalCancel).click();
  });

  it('ID(CNV-6835) Notification about AutoDetach disks is displayed on VM stop', () => {
    verifyDiskAttached(autoHotplugDisk3, 'AutoDetachHotplug');
    detailViewAction(VM_ACTION.Stop);
    cy.get(tags.alertDescr)
      .should('exist')
      .should('contain', autoHotplugDisk3.name);
    cy.get(tags.modalCancel).click();
  });

  it('ID(CNV-6834) AutoDetach hotplug disk is detached on VM stop', () => {
    verifyDiskAttached(autoHotplugDisk4, 'PersistingHotplug');
    detailViewAction(VM_ACTION.Stop);
    waitForStatus(VM_STATUS.Stopped);
    cy.get(`[data-id="${autoHotplugDisk4.name}"]`).should('not.exist');

    // cleanup
    detailViewAction(VM_ACTION.Start);
    waitForStatus(VM_STATUS.Running);
  });

  it('ID(CNV-6750) AutoDetach hotplug disk is detached on VM restart', () => {
    verifyDiskAttached(autoHotplugDisk, 'PersistingHotplug');
    detailViewAction(VM_ACTION.Restart);
    waitForStatus(VM_STATUS.Running);
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
