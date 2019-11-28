import * as _ from 'lodash';
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  click,
  createResources,
  deleteResources,
  searchYAML,
} from '@console/shared/src/test-utils/utils';
import { createNICButton } from '../views/kubevirtDetailView.view';
import { nicNetwork } from '../views/dialogs/networkInterface.view';
import { getInterfaces } from '../../src/selectors/vm/selectors';
import { getVMIDisks } from '../../src/selectors/vmi/basic';
import { multusNAD, hddDisk, networkInterface, getVMManifest } from './utils/mocks';
import { getSelectOptions, getResourceObject } from './utils/utils';
import { VM_BOOTUP_TIMEOUT_SECS, VM_ACTIONS_TIMEOUT_SECS, TAB, VM_ACTION } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

describe('Add/remove disks and NICs on respective VM pages', () => {
  const testVm = getVMManifest('Container', testName, `vm-disk-nic-${testName}`);
  const vm = new VirtualMachine(testVm.metadata);

  beforeAll(async () => {
    createResources([multusNAD, testVm]);
  }, VM_BOOTUP_TIMEOUT_SECS);

  afterAll(() => {
    deleteResources([multusNAD, testVm]);
  });

  it(
    'Add/remove disk on VM disks page',
    async () => {
      await vm.addDisk(hddDisk);
      expect(await vm.getAttachedDisks()).toContain(hddDisk);
      await vm.action(VM_ACTION.Start);
      expect(
        _.find(
          getVMIDisks(getResourceObject(vm.name, vm.namespace, 'vmi')),
          (o) => o.name === hddDisk.name,
        ),
      ).toBeDefined();
      await vm.action(VM_ACTION.Stop);
      await vm.removeDisk(hddDisk.name);
      expect(await vm.getAttachedDisks()).not.toContain(hddDisk);
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );

  it(
    'Add/remove nic on VM Network Interfaces page',
    async () => {
      await vm.addNIC(networkInterface);
      expect(await vm.getAttachedNICs()).toContain(networkInterface);
      await vm.action(VM_ACTION.Start);
      expect(searchYAML(networkInterface.network, vm.name, vm.namespace, 'vmi')).toBe(true);
      await vm.action(VM_ACTION.Stop);
      await vm.removeNIC(networkInterface.name);
      expect(await vm.getAttachedNICs()).not.toContain(networkInterface);
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );

  it('NIC cannot be added twice using one net-attach-def', async () => {
    await vm.navigateToTab(TAB.NetworkInterfaces);
    if (
      (await vm.getAttachedNICs()).filter((nic) => nic.name === networkInterface.name).length === 0
    ) {
      await vm.addNIC(networkInterface);
    }

    // Verify the NIC is added in VM Manifest
    const resource = getResourceObject(vm.name, vm.namespace, vm.kind);
    const nic = _.find(getInterfaces(resource), (o) => o.name === networkInterface.name);
    expect(nic).not.toBe(undefined);

    // Try to add the NIC again
    await click(createNICButton, 1000);
    await browser.sleep(1000).then(() => browser.wait(until.presenceOf(nicNetwork)));

    // The network dropdown should be either empty (disabled) or not containing the already used net-attach-def
    await browser.wait(
      until.or(
        async () => {
          return !(await nicNetwork.isEnabled());
        },
        async () => {
          return !(await getSelectOptions(nicNetwork)).includes(networkInterface.network);
        },
      ),
    );
  });
});
