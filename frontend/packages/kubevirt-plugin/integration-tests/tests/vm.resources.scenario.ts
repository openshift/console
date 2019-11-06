import * as _ from 'lodash';
import { $, browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  click,
  createResources,
  deleteResources,
  searchYAML,
  getDropdownOptions,
} from '@console/shared/src/test-utils/utils';
import { createNic, networkTypeDropdownId } from '../views/kubevirtDetailView.view';
import { getInterfaces } from '../../src/selectors/vm/selectors';
import { multusNAD, hddDisk, networkInterface, getVMManifest } from './utils/mocks';
import { getResourceObject } from './utils/utils';
import { VM_BOOTUP_TIMEOUT_SECS, VM_ACTIONS_TIMEOUT_SECS, TABS, VM_ACTIONS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

describe('Add/remove disks and NICs on respective VM pages', () => {
  const testVm = getVMManifest('Container', testName, `vm-disk-nic-${testName}`);
  const vm = new VirtualMachine(testVm.metadata);

  beforeAll(async () => {
    createResources([multusNAD, testVm]);
    await vm.action(VM_ACTIONS.START);
  }, VM_BOOTUP_TIMEOUT_SECS);

  afterAll(() => {
    deleteResources([multusNAD, testVm]);
  });

  xit(
    'BZ(1753688) Add/remove disk on VM disks page',
    async () => {
      await vm.addDisk(hddDisk);
      expect(await vm.getAttachedDisks()).toContain(hddDisk);

      let vmi = await vm.navigateToVMI(TABS.OVERVIEW);
      expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(false);

      await vm.action(VM_ACTIONS.RESTART);

      vmi = await vm.navigateToVMI(TABS.OVERVIEW);
      expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(true);

      await vm.removeDisk(hddDisk.name);
      expect(await vm.getAttachedDisks()).not.toContain(hddDisk);

      await vm.action(VM_ACTIONS.RESTART);

      vmi = await vm.navigateToVMI(TABS.OVERVIEW);
      expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(false);
    },
    VM_ACTIONS_TIMEOUT_SECS * 2, // VM is restarted twice
  );

  it(
    'Add/remove nic on VM Network Interfaces page',
    async () => {
      await vm.addNIC(networkInterface);

      expect(searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi')).toBe(
        false,
      );

      await vm.action(VM_ACTIONS.RESTART);
      expect(searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi')).toBe(
        true,
      );

      await vm.removeNIC(networkInterface.name);
      expect((await vm.getAttachedNICs()).includes(networkInterface)).toBe(false);

      await vm.action(VM_ACTIONS.RESTART);

      expect(searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi')).toBe(
        false,
      );
    },
    VM_ACTIONS_TIMEOUT_SECS * 2, // VM is restarted twice
  );

  it('NIC cannot be added twice using one net-attach-def', async () => {
    await vm.navigateToTab(TABS.NICS);
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
    await click(createNic, 1000);
    await browser.sleep(1000).then(() => browser.wait(until.presenceOf($(networkTypeDropdownId))));

    // The network dropdown should be either empty (disabled) or not containing the already used net-attach-def
    await browser.wait(
      until.or(
        async () => {
          return !(await $(networkTypeDropdownId).isEnabled());
        },
        async () => {
          return !(await getDropdownOptions(networkTypeDropdownId)).includes(
            networkInterface.networkDefinition,
          );
        },
      ),
    );
  });
});
