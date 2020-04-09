import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS, VM_STATUS, TAB } from './utils/consts';
import { getVMIManifest } from './utils/mocks';
import { VirtualMachine } from './models/virtualMachine';
import { resourceRows } from '@console/internal-integration-tests/views/crud.view';
import { vmDetailCdEditButton, vmDetailBootOrderEditButton } from '../views/virtualMachine.view';

import * as kubevirtDetailView from '../views/kubevirtDetailView.view';

const waitForVM = async (
  manifest: any,
  status: VM_STATUS,
  kind?: 'virtualmachines' | 'virtualmachineinstances',
) => {
  const vm = new VirtualMachine(manifest.metadata, kind || 'virtualmachines');
  createResource(manifest);
  await vm.waitForStatus(status);
  return vm;
};

describe('KubeVirt VMI detail - editing', () => {
  const testVM = getVMIManifest('Container', testName);
  let vm: VirtualMachine;

  afterAll(() => {
    deleteResource(testVM);
  });

  beforeAll(async () => {
    vm = await waitForVM(testVM, VM_STATUS.Running, 'virtualmachineinstances');
    await vm.navigateToDashboard();
  });

  it(
    'ID(CNV-4039) should not have cdrom edit buttons',
    async () => {
      await vm.navigateToDetail();
      expect(vmDetailCdEditButton(vm.namespace, vm.name).isPresent()).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4040) should not have boot order edit buttons',
    async () => {
      await vm.navigateToDetail();
      expect(vmDetailBootOrderEditButton(vm.namespace, vm.name).isPresent()).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4042) should not have add nic button',
    async () => {
      await vm.navigateToTab(TAB.NetworkInterfaces);
      expect(kubevirtDetailView.createNICButton.isPresent()).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4043) nic row kebab button is disabled',
    async () => {
      await vm.navigateToTab(TAB.NetworkInterfaces);
      expect(
        resourceRows
          .first()
          .$('[data-test-id=kebab-button]')
          .isEnabled(),
      ).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4041) should not have add disk button',
    async () => {
      await vm.navigateToTab(TAB.Disks);
      expect(kubevirtDetailView.createDiskButton.isPresent()).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-3694) disk row kebab button is disabled',
    async () => {
      await vm.navigateToTab(TAB.Disks);
      expect(
        resourceRows
          .first()
          .$('[data-test-id=kebab-button]')
          .isEnabled(),
      ).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
