import { DISK_SOURCE, VM_ACTION } from '../../const';
// import {ProvisionSource} from '../../enums/provisionSource';
// import {testName} from '../../support';
import { Disk } from '../../types/vm';
import { confirmButton, detailViewAction } from '../../view/actions';
import { addDisk, delDisk } from '../../view/dialog';
import * as tags from '../../view/selector';
import { tab } from '../../view/tab';
import { virtualization } from '../../view/virtualization';
// import {action, vm, waitForStatus} from '../../view/vm';
// import {actionButtons} from "../../view/selector";

// const vmData: VirtualMachineData = {
//   name: `test-vm-hotplug-${testName.split('-')[1]}`,
//   // name: `fedora-spare-gecko`,
//   namespace: testName,
//   // namespace: 'leon-manual-49',
//   template: TEMPLATE_NAME,
//   provisionSource: ProvisionSource.URL,
//   pvcSize: '1',
//   sshEnable: false,
//   startOnCreation: true,
// };

const hotPlugDisk: Disk = {
  size: '2',
};

const FCB32_URL_IMG =
  'http://cnv-qe-server.rhevdev.lab.eng.rdu2.redhat.com/files/cnv-tests/fedora-images/Fedora-Cloud-Base-32-1.6.x86_64.qcow2';
const FCB32_URL_REG = 'quay.io/kubevirt/fedora-cloud-container-disk-demo:latest';
const PVC_NAME = 'hotplug-test-pvc';
const TMP_VM = 'rhel6-eli-lusk';

describe('Test UI for VM disk hot-plug', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    // cy.createProject(testName);

    // vm.create(vmData);
    // waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT);

    virtualization.vms.visit();

    // cy.byLegacyTestID(vmData.name)
    cy.byLegacyTestID(TMP_VM)
      .should('exist')
      .click();
    tab.navigateToDisk();
  });

  // after(() => {
  //   cy.deleteResource({
  //     kind: 'VirtualMachine',
  //     metadata: {
  //       name: vmData.name,
  //       namespace: vmData.namespace,
  //     },
  //   });
  //   cy.deleteResource({
  //     kind: 'Namespace',
  //     metadata: {
  //       name: testName,
  //     },
  //   });
  // });

  it('ID(CNV-6828) Attach Persistent hotplug disk with [Blank] as source to running VM', () => {
    hotPlugDisk.autoDetach = false;
    hotPlugDisk.name = 'disk-6828';
    hotPlugDisk.source = DISK_SOURCE.Blank;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'PersistingHotplug');
  });

  it('ID(CNV-6839) Detach hotplug disk from running VM', () => {
    hotPlugDisk.name = 'disk-6828';
    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('exist');

    delDisk(hotPlugDisk.name);

    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('not.exist');
  });

  it('ID(CNV-6860) Attach Persistent hotplug disk with [Import via URL] as source to running VM', () => {
    hotPlugDisk.autoDetach = false;
    hotPlugDisk.name = 'disk-6860';
    hotPlugDisk.source = DISK_SOURCE.Url;
    hotPlugDisk.url = FCB32_URL_IMG;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'PersistingHotplug');
  });

  it('ID(CNV-6833) Persistent hotplug disk is not detached on VM stop', () => {
    hotPlugDisk.name = 'disk-6860';

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'PersistingHotplug');

    detailViewAction(VM_ACTION.Stop);
    cy.get(confirmButton).click();
    // waitForCurrentVMStatus(VM_STATUS.Off, VM_ACTION_TIMEOUT.VM_BOOTUP);

    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('exist');

    // cleanup
    delDisk(hotPlugDisk.name);
    detailViewAction(VM_ACTION.Start);
    // waitForCurrentVMStatus(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
  });

  it('ID(CNV-6863) Attach Persistent hotplug disk with [Import via Registry] as source to running VM', () => {
    hotPlugDisk.autoDetach = false;
    hotPlugDisk.name = 'disk-6863';
    hotPlugDisk.source = DISK_SOURCE.Container;
    hotPlugDisk.url = FCB32_URL_REG;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'PersistingHotplug');
  });

  it('ID(CNV-6749) Persistent hotplug disk is not detached on VM restart', () => {
    hotPlugDisk.name = 'disk-6863';

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'PersistingHotplug');

    detailViewAction(VM_ACTION.Restart);
    cy.get(confirmButton).click();
    // waitForCurrentVMStatus(VM_STATUS.Starting, VM_ACTION_TIMEOUT.VM_BOOTUP);
    // waitForCurrentVMStatus(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('exist');
  });

  it('ID(CNV-6862) Attach Persistent hotplug disk with [Clone existing PVC] as source to running VM', () => {
    hotPlugDisk.autoDetach = false;
    hotPlugDisk.name = 'disk-6862';
    hotPlugDisk.source = DISK_SOURCE.AttachClonedDisk;
    hotPlugDisk.pvc = PVC_NAME;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'PersistingHotplug');
  });

  xit('ID(CNV-6861) Attach Persistent hotplug disk with [Use an existing PVC] as source to running VM', () => {
    hotPlugDisk.autoDetach = false;
    hotPlugDisk.name = 'disk-6861';
    hotPlugDisk.source = DISK_SOURCE.AttachDisk;
    hotPlugDisk.pvc = PVC_NAME;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'PersistingHotplug');
  });

  it('ID(CNV-6856) Attach AutoDetach hotplug disk with [Blank] as source to running VM', () => {
    hotPlugDisk.autoDetach = true;
    hotPlugDisk.name = 'disk-6856';
    hotPlugDisk.source = DISK_SOURCE.Blank;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'AutoDetachHotplug');
  });

  it('ID(CNV-6835) Notification about AutoDetach disks is displayed on VM stop', () => {
    hotPlugDisk.name = 'disk-6856';

    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('exist');

    detailViewAction(VM_ACTION.Stop);

    cy.get(tags.alertDescr)
      .should('exist')
      .should('contain', hotPlugDisk.name);
    cy.get(tags.modalCancel).click();
  });

  it('ID(CNV-6834) AutoDetach hotplug disk is detached on VM stop', () => {
    hotPlugDisk.name = 'disk-6856';

    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('exist');

    detailViewAction(VM_ACTION.Stop);
    cy.get(confirmButton).click();
    // waitForCurrentVMStatus(VM_STATUS.Off, VM_ACTION_TIMEOUT.VM_BOOTUP);

    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('not.exist');

    detailViewAction(VM_ACTION.Start);
    // waitForCurrentVMStatus(VM_STATUS.Starting, VM_ACTION_TIMEOUT.VM_BOOTUP);
    // waitForCurrentVMStatus(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
  });

  it('ID(CNV-6855) Attach AutoDetach hotplug disk with [Import via URL] as source selection to running VM', () => {
    hotPlugDisk.autoDetach = true;
    hotPlugDisk.name = 'disk-6855';
    hotPlugDisk.source = DISK_SOURCE.Url;
    hotPlugDisk.url = FCB32_URL_IMG;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'AutoDetachHotplug');
  });

  it('ID(CNV-6750) AutoDetach hotplug disk is detached on VM restart', () => {
    hotPlugDisk.name = 'disk-6855';

    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('exist');

    detailViewAction(VM_ACTION.Restart);
    cy.get(confirmButton).click();
    // waitForCurrentVMStatus(VM_STATUS.Starting, VM_ACTION_TIMEOUT.VM_BOOTUP);
    // waitForCurrentVMStatus(VM_STATUS.Running, VM_ACTION_TIMEOUT.VM_BOOTUP);
    cy.get(`[data-id="${hotPlugDisk.name}"]`).should('not.exist');
  });

  it('ID(CNV-6859) Attach AutoDetach hotplug disk with [Import via Registry] to running VM', () => {
    hotPlugDisk.autoDetach = true;
    hotPlugDisk.name = 'disk-6859';
    hotPlugDisk.source = DISK_SOURCE.Container;
    hotPlugDisk.url = FCB32_URL_REG;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'AutoDetachHotplug');
  });

  it('ID(CNV-6858) Attach AutoDetach hotplug disk with [Clone existing PVC] to running VM', () => {
    hotPlugDisk.autoDetach = true;
    hotPlugDisk.name = 'disk-6858';
    hotPlugDisk.source = DISK_SOURCE.AttachClonedDisk;
    hotPlugDisk.pvc = PVC_NAME;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'AutoDetachHotplug');
  });

  xit('ID(CNV-6857) Attach AutoDetach hotplug disk with [Use an existing PVC] as source selection to running VM', () => {
    hotPlugDisk.autoDetach = true;
    hotPlugDisk.name = 'disk-6857';
    hotPlugDisk.source = DISK_SOURCE.AttachDisk;
    hotPlugDisk.pvc = PVC_NAME;

    addDisk(hotPlugDisk);

    cy.get(`[data-id="${hotPlugDisk.name}"]`)
      .should('exist')
      .should('contain', 'AutoDetachHotplug');
  });
});
