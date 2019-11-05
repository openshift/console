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
} from '@console/shared/src/test-utils/utils';
import {
  waitForActionFinished,
  waitForStatusIcon,
  statusIcons,
} from '../views/virtualMachine.view';
import { getVMManifest } from './utils/mocks';
import { fillInput } from './utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_ACTIONS,
  TABS,
  VM_IMPORT_TIMEOUT_SECS,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

describe('Test VM actions', () => {
  const leakedResources = new Set<string>();
  const testVM = getVMManifest('URL', testName);

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
      await waitForStatusIcon(statusIcons.off, VM_IMPORT_TIMEOUT_SECS);
    }, VM_IMPORT_TIMEOUT_SECS);

    it(
      'Starts VM',
      async () => {
        await vm.listViewAction(VM_ACTIONS.START);
        await fillInput(textFilter, vmName);
        await waitForActionFinished(VM_ACTIONS.START);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it(
      'Restarts VM',
      async () => {
        await vm.listViewAction(VM_ACTIONS.RESTART);
        await fillInput(textFilter, vmName);
        await waitForActionFinished(VM_ACTIONS.RESTART);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('Stops VM', async () => {
      await vm.listViewAction(VM_ACTIONS.STOP);
      await fillInput(textFilter, vmName);
      await waitForActionFinished(VM_ACTIONS.STOP);
    });

    it('Deletes VM', async () => {
      await vm.listViewAction(VM_ACTIONS.DELETE);
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
      await vm.navigateToTab(TABS.OVERVIEW);
      await waitForStatusIcon(statusIcons.off, VM_IMPORT_TIMEOUT_SECS);
    }, VM_IMPORT_TIMEOUT_SECS);

    it(
      'Starts VM',
      async () => {
        await vm.action(VM_ACTIONS.START);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it(
      'Restarts VM',
      async () => {
        await vm.action(VM_ACTIONS.RESTART);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('Stops VM', async () => {
      await vm.action(VM_ACTIONS.STOP);
    });

    it('Deletes VM', async () => {
      await vm.action(VM_ACTIONS.DELETE);
      await isLoaded();
      await fillInput(textFilter, vmName);
      await browser.wait(until.and(waitForCount(resourceRows, 0)), PAGE_LOAD_TIMEOUT_SECS);
      removeLeakableResource(leakedResources, testVM);
    });
  });
});
