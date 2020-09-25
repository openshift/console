import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  resourceRows,
  resourceRowsPresent,
} from '@console/internal-integration-tests/views/crud.view';
import {
  addLeakableResource,
  createResource,
  removeLeakedResources,
  removeLeakableResource,
  waitForCount,
  click,
} from '@console/shared/src/test-utils/utils';
import { getVMManifest } from './mocks/mocks';
import { pauseVM } from './utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
} from './utils/constants/common';
import { VirtualMachine } from './models/virtualMachine';
import { unpauseButton } from '../views/dialogs/editStatusView';
import { VM_STATUS, VM_ACTION } from './utils/constants/vm';

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
      await vm.navigateToListView();
      await resourceRowsPresent();
      await browser.wait(
        until.textToBePresentInElement(resourceRows.first(), VM_STATUS.Off),
        VM_IMPORT_TIMEOUT_SECS,
      );
    }, VM_IMPORT_TIMEOUT_SECS);

    it(
      'ID(CNV-4013) Starts VM',
      async () => {
        await vm.listViewAction(VM_ACTION.Start);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-4014) Restarts VM',
      async () => {
        await vm.listViewAction(VM_ACTION.Restart);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-765) Unpauses VM',
      async () => {
        pauseVM(vmName, testName);
        await vm.listViewAction(VM_ACTION.Unpause);
        await vm.waitForStatus(VM_STATUS.Running);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('ID(CNV-4015) Stops VM', async () => {
      await vm.listViewAction(VM_ACTION.Stop);
    });

    it('ID(CNV-4016) Deletes VM', async () => {
      await vm.listViewAction(VM_ACTION.Delete, false);
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
      await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
    }, VM_IMPORT_TIMEOUT_SECS);

    it(
      'ID(CNV-4017) Starts VM',
      async () => {
        await vm.detailViewAction(VM_ACTION.Start);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-4018) Restarts VM',
      async () => {
        await vm.detailViewAction(VM_ACTION.Restart);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-1794) Unpauses VM',
      async () => {
        pauseVM(vmName, testName);
        await vm.waitForStatus(VM_STATUS.Paused);
        await vm.detailViewAction(VM_ACTION.Unpause);
        await vm.waitForStatus(VM_STATUS.Running);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('ID(CNV-4019) Unpauses VM via modal dialog', async () => {
      await vm.waitForStatus(VM_STATUS.Running);
      pauseVM(vmName, testName);
      await vm.waitForStatus(VM_STATUS.Paused);
      await vm.modalEditStatus();
      await click(unpauseButton);
      await vm.waitForStatus(VM_STATUS.Running);
    });

    it('ID(CNV-4020) Stops VM', async () => {
      await vm.detailViewAction(VM_ACTION.Stop);
    });

    it('ID(CNV-4021) Deletes VM', async () => {
      await vm.detailViewAction(VM_ACTION.Delete, false);
      await vm.navigateToListView();
      await browser.wait(until.and(waitForCount(resourceRows, 0)), PAGE_LOAD_TIMEOUT_SECS);
      removeLeakableResource(leakedResources, testVM);
    });
  });
});
