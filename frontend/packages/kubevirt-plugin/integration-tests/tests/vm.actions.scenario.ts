import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '../../../../integration-tests/protractor.conf';
import {
  resourceRows,
  resourceRowsPresent,
  isLoaded,
  textFilter,
} from '../../../../integration-tests/views/crud.view';
import { listViewAction } from '../views/vm.actions.view';
import { waitForActionFinished } from '../views/virtualMachine.view';
import {
  addLeakableResource,
  createResource,
  removeLeakedResources,
  removeLeakableResource,
  waitForCount,
} from '../../../console-shared/src/test-utils/utils';
import { getVmManifest } from './utils/mocks';
import { fillInput } from './utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VMACTIONS,
  TABS,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

describe('Test VM actions', () => {
  const leakedResources = new Set<string>();
  const testVm = getVmManifest('Container', testName);

  afterAll(async () => {
    removeLeakedResources(leakedResources);
  });

  describe('Test VM list view kebab actions', () => {
    const vmName = `vm-list-actions-${testName}`;

    beforeAll(async () => {
      testVm.metadata.name = vmName;
      createResource(testVm);
      addLeakableResource(leakedResources, testVm);

      // Navigate to Virtual Machines page
      await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
      await isLoaded();
      await fillInput(textFilter, vmName);
      await resourceRowsPresent();
    });

    it('Starts VM', async () => {
      await listViewAction(vmName)(VMACTIONS.START, true);
      await fillInput(textFilter, vmName);
      await waitForActionFinished(VMACTIONS.START);
    });

    it(
      'Restarts VM',
      async () => {
        await listViewAction(vmName)(VMACTIONS.RESTART, true);
        await fillInput(textFilter, vmName);
        await waitForActionFinished(VMACTIONS.RESTART);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('Stops VM', async () => {
      await listViewAction(vmName)(VMACTIONS.STOP, true);
      await fillInput(textFilter, vmName);
      await waitForActionFinished(VMACTIONS.STOP);
    });

    it('Deletes VM', async () => {
      await listViewAction(vmName)(VMACTIONS.DELETE, true);
      await isLoaded();
      await fillInput(textFilter, vmName);
      await browser.wait(until.and(waitForCount(resourceRows, 0)), PAGE_LOAD_TIMEOUT_SECS);
      removeLeakableResource(leakedResources, testVm);
    });
  });

  describe('Test VM detail view actions dropdown', () => {
    const vmName = `vm-detail-actions-${testName}`;
    const vm = new VirtualMachine({ name: vmName, namespace: testName });

    beforeAll(async () => {
      testVm.metadata.name = vmName;
      createResource(testVm);
      addLeakableResource(leakedResources, testVm);
      await vm.navigateToTab(TABS.OVERVIEW);
    });

    it(
      'Starts VM',
      async () => {
        await vm.action(VMACTIONS.START);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it(
      'Restarts VM',
      async () => {
        await vm.action(VMACTIONS.RESTART);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('Stops VM', async () => {
      await vm.action(VMACTIONS.STOP);
    });

    it('Deletes VM', async () => {
      await vm.action(VMACTIONS.DELETE);
      await isLoaded();
      await fillInput(textFilter, vmName);
      await browser.wait(until.and(waitForCount(resourceRows, 0)), PAGE_LOAD_TIMEOUT_SECS);
      removeLeakableResource(leakedResources, testVm);
    });
  });
});
