import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import {
  resourceRows,
  resourceRowsPresent,
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
import { getVMManifest } from './utils/mocks';
import { pauseVM } from './utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_ACTION,
  TAB,
  VM_IMPORT_TIMEOUT_SECS,
  VM_STATUS,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

describe('Test VM actions', () => {
  const leakedResources = new Set<string>();
  const testVM = getVMManifest('Container', testName);

  afterAll(async () => {
    removeLeakedResources(leakedResources);
  });

  describe('Test VM list view kebab dropdown', () => {
    const vmName = `vm-list-actions-${testName}`;
    let vm: VirtualMachine;

    beforeAll(async () => {
      testVM.metadata.name = vmName;
      createResource(testVM);
      addLeakableResource(leakedResources, testVM);
      vm = new VirtualMachine(testVM.metadata);

      // Navigate to Virtual Machines page
      await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
      await isLoaded();
      await fillInput(textFilter, vmName);
      await resourceRowsPresent();
      await browser.wait(
        until.textToBePresentInElement(resourceRows.first(), VM_STATUS.Off),
        VM_IMPORT_TIMEOUT_SECS,
      );
    }, VM_IMPORT_TIMEOUT_SECS);

    it(
      'Starts VM',
      async () => {
        await vm.listViewAction(VM_ACTION.Start);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it(
      'Restarts VM',
      async () => {
        await vm.listViewAction(VM_ACTION.Restart);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it(
      'Unpauses VM',
      async () => {
        pauseVM(vmName, testName);
        await vm.listViewAction(VM_ACTION.Unpause);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('Stops VM', async () => {
      await vm.listViewAction(VM_ACTION.Stop);
    });

    it('Deletes VM', async () => {
      await vm.listViewAction(VM_ACTION.Delete, false);
      await isLoaded();
      await fillInput(textFilter, vmName);
      await browser.wait(until.and(waitForCount(resourceRows, 0)), PAGE_LOAD_TIMEOUT_SECS);
      removeLeakableResource(leakedResources, testVM);
    });
  });

  describe('Test VM detail view actions dropdown', () => {
    const vmName = `vm-detail-actions-${testName}`;
    const vm = new VirtualMachine({ name: vmName, namespace: testName });

    beforeAll(async () => {
      testVM.metadata.name = vmName;
      createResource(testVM);
      addLeakableResource(leakedResources, testVM);
      await vm.navigateToTab(TAB.Details);
      await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
    }, VM_IMPORT_TIMEOUT_SECS);

    it(
      'Starts VM',
      async () => {
        await vm.action(VM_ACTION.Start);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it(
      'Restarts VM',
      async () => {
        await vm.action(VM_ACTION.Restart);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it(
      'Unpauses VM',
      async () => {
        pauseVM(vmName, testName);
        await vm.action(VM_ACTION.Unpause);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('Stops VM', async () => {
      await vm.action(VM_ACTION.Stop);
    });

    it('Deletes VM', async () => {
      await vm.action(VM_ACTION.Delete, false);
      await vm.navigateToListView();
      await fillInput(textFilter, vmName);
      await isLoaded();
      await browser.wait(until.and(waitForCount(resourceRows, 0)), PAGE_LOAD_TIMEOUT_SECS);
      removeLeakableResource(leakedResources, testVM);
    });
  });
});
