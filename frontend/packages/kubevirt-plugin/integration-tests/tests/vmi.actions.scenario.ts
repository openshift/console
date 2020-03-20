import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  resourceRows,
  isLoaded,
  textFilter,
} from '@console/internal-integration-tests/views/crud.view';
import {
  addLeakableResource,
  createResource,
  removeLeakedResources,
  removeLeakableResource,
  waitForCount,
  fillInput,
} from '@console/shared/src/test-utils/utils';
import { getVMIManifest } from './utils/mocks';
import {
  VM_DELETE_TIMEOUT_SECS,
  VMI_ACTION,
  TAB,
  VM_IMPORT_TIMEOUT_SECS,
  VM_STATUS,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

const waitForVM = async (
  manifest: any,
  status: VM_STATUS,
  resourcesSet: Set<string>,
  kind?: 'virtualmachines' | 'virtualmachineinstances',
) => {
  const vm = new VirtualMachine(manifest.metadata, kind || 'virtualmachines');

  createResource(manifest);
  addLeakableResource(resourcesSet, manifest);
  await vm.waitForStatus(status);

  return vm;
};

const waitForVMDelete = async (vm: VirtualMachine) => {
  await vm.navigateToListView();
  await fillInput(textFilter, vm.name);
  await browser.wait(until.and(waitForCount(resourceRows, 0)), VM_DELETE_TIMEOUT_SECS);
};

describe('Test VMI actions', () => {
  const leakedResources = new Set<string>();

  afterAll(async () => {
    removeLeakedResources(leakedResources);
  });

  describe('Test VMI list view kebab dropdown', () => {
    let vm: VirtualMachine;
    let testVM: any;

    beforeAll(async () => {
      testVM = getVMIManifest('Container', testName, `vm-list-actions-${testName}`);
      vm = await waitForVM(testVM, VM_STATUS.Running, leakedResources, 'virtualmachineinstances');
    }, VM_IMPORT_TIMEOUT_SECS);

    it('Deletes VMI', async () => {
      await vm.navigateToListView();
      await isLoaded();

      await vm.listViewAction(VMI_ACTION.Delete, false);
      removeLeakableResource(leakedResources, testVM);
      await waitForVMDelete(vm);
    });
  });

  describe('Test VMI detail view actions dropdown', () => {
    let vm: VirtualMachine;
    let testVM: any;

    beforeAll(async () => {
      testVM = getVMIManifest('Container', testName, `vm-detail-actions-${testName}`);
      vm = await waitForVM(testVM, VM_STATUS.Running, leakedResources, 'virtualmachineinstances');
    }, VM_IMPORT_TIMEOUT_SECS);

    it('Deletes VM', async () => {
      await vm.navigateToTab(TAB.Details);
      await isLoaded();

      await vm.action(VMI_ACTION.Delete, false);
      removeLeakableResource(leakedResources, testVM);
      await waitForVMDelete(vm);
    });
  });
});
