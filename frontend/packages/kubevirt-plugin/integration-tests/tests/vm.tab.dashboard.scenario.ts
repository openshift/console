import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  createResources,
  deleteResources,
  waitForStringInElement,
} from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import {
  vmDetailsName,
  vmDetailsNamespace,
  vmDetailsHostname,
  vmDetailsNode,
  vmDetailsIPAddress,
  vmDetailsOS,
  vmDetailsTZ,
  vmDetailsLoggedUser,
  vmStatus,
  vmStatusAlert,
  vmInventoryNICs,
  vmInventoryDisks,
} from '../views/dashboard.view';
import { getVMManifest, hddDisk, multusNetworkInterface, multusNAD } from './utils/mocks';
import { VirtualMachine } from './models/virtualMachine';
import {
  VM_STATUS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTION,
  VM_IMPORT_TIMEOUT_SECS,
  TAB,
  VM_STOP_TIMEOUT_SECS,
  NOT_AVAILABLE,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
} from './utils/consts';

describe('Test VM dashboard', () => {
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nruncmd:\n- dnf install -y qemu-guest-agent\n- systemctl start qemu-guest-agent`;
  const testVM = getVMManifest('Container', testName, null, cloudInit);

  let vm: VirtualMachine;

  beforeAll(async () => {
    createResources([multusNAD, testVM]);
    vm = new VirtualMachine(testVM.metadata);
    await vm.navigateToOverview();
    try {
      await browser.wait(
        until.not(until.textToBePresentInElement(vmStatus, VM_STATUS.Off)),
        PAGE_LOAD_TIMEOUT_SECS,
      );
    } catch (ex) {
      // continue, this is optional condition
      // we want to wait for import to start but in some cases it may have already completed
    }
    await browser.wait(
      until.textToBePresentInElement(vmStatus, VM_STATUS.Off),
      VM_IMPORT_TIMEOUT_SECS,
    );
  }, VM_IMPORT_TIMEOUT_SECS);

  afterAll(() => {
    deleteResources([vm.asResource(), multusNAD]);
  });

  it('ID(CNV-3333) Inventory card', async () => {
    expect(vmInventoryNICs.getText()).toEqual('1 NIC');
    expect(vmInventoryNICs.$('a').getAttribute('href')).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/nics`),
    );
    expect(vmInventoryDisks.getText()).toEqual('2 Disks');
    expect(vmInventoryDisks.$('a').getAttribute('href')).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/disks`),
    );

    await vm.addDisk(hddDisk);
    await vm.addNIC(multusNetworkInterface);
    await vm.navigateToTab(TAB.Overview);

    expect(vmInventoryNICs.getText()).toEqual('2 NICs');
    expect(vmInventoryDisks.getText()).toEqual('3 Disks');

    await vm.removeDisk(hddDisk.name);
    await vm.removeNIC(multusNetworkInterface.name);
  });

  it(
    'ID(CNV-3330) Status card',
    async () => {
      await vm.waitForStatus(VM_STATUS.Off);
      await vm.navigateToOverview();
      expect(vmStatus.getText()).toEqual(VM_STATUS.Off);

      await vm.action(VM_ACTION.Start, true, VM_BOOTUP_TIMEOUT_SECS);
      await vm.navigateToTab(TAB.Overview);
      expect(vmStatus.getText()).toEqual(VM_STATUS.Running);
      await browser.wait(until.stalenessOf(vmStatusAlert));
    },
    VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
  );

  it('ID(CNV-3332) Details card', async () => {
    await browser.wait(waitForStringInElement(vmDetailsHostname, vm.name));
    expect(vmDetailsName.getText()).toEqual(vm.name);
    expect(vmDetailsNamespace.getText()).toEqual(vm.namespace);
    expect(vmDetailsNode.getText()).not.toEqual(NOT_AVAILABLE);
    expect(vmDetailsIPAddress.getText()).not.toEqual(NOT_AVAILABLE);
    expect(vmDetailsOS.getText()).toContain('Fedora');
    expect(vmDetailsTZ.getText()).toContain('UTC');
    expect(vmDetailsLoggedUser.getText()).toEqual('No users logged in');

    await vm.action(VM_ACTION.Stop, true, VM_STOP_TIMEOUT_SECS);
    await vm.navigateToTab(TAB.Overview);

    expect(vmDetailsNode.getText()).toEqual(NOT_AVAILABLE);
    expect(vmDetailsIPAddress.getText()).toEqual(NOT_AVAILABLE);
    expect(vmDetailsHostname.getText()).toEqual('VM not running');
    expect(vmDetailsOS.getText()).toEqual('Red Hat Enterprise Linux 7.0 or higher');
    expect(vmDetailsTZ.getText()).toEqual('VM not running');
    expect(vmDetailsLoggedUser.getText()).toEqual('VM not running');
  });
});
