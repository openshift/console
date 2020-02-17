import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResources, deleteResource } from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '../../src/models';
import {
  vmDetailsName,
  vmDetailsNamespace,
  vmDetailsNode,
  vmDetailsIPAddress,
  vmStatus,
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
} from './utils/consts';

describe('Test VM dashboard', () => {
  const testVM = getVMManifest('URL', testName, null, 'foo');

  let vm: VirtualMachine;

  afterAll(async () => {
    deleteResource(vm.asResource());
  });

  beforeAll(async () => {
    createResources([multusNAD, testVM]);
    vm = new VirtualMachine(testVM.metadata);
    await vm.navigateToDashboard();
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

  it('Inventory card', async () => {
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
  });

  it('Status card', async () => {
    await vm.waitForStatus(VM_STATUS.Off);
    await vm.navigateToDashboard();
    expect(vmStatus.getText()).toEqual(VM_STATUS.Off);

    await vm.action(VM_ACTION.Start, true, VM_BOOTUP_TIMEOUT_SECS);
    await vm.navigateToTab(TAB.Overview);
    expect(vmStatus.getText()).toEqual(VM_STATUS.Running);
  });

  xit('BZ(1803857) Details card', async () => {
    expect(vmDetailsName.getText()).toEqual(vm.name);
    expect(vmDetailsNamespace.getText()).toEqual(vm.namespace);
    expect(vmDetailsNode.getText()).not.toEqual(NOT_AVAILABLE);
    expect(vmDetailsIPAddress.getText()).not.toEqual(NOT_AVAILABLE);

    await vm.action(VM_ACTION.Stop, true, VM_STOP_TIMEOUT_SECS);
    await vm.navigateToTab(TAB.Overview);

    expect(vmDetailsNode.getText()).toEqual(NOT_AVAILABLE);
    expect(vmDetailsIPAddress.getText()).toEqual(NOT_AVAILABLE);
  });
});
