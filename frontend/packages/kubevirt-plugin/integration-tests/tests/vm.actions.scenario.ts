import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '../../../../integration-tests/protractor.conf';
import {
  resourceRows,
  resourceRowsPresent,
  isLoaded,
  textFilter,
} from '../../../../integration-tests/views/crud.view';
import {
  waitForActionFinished,
  waitForStatusIcon,
  statusIcons,
} from '../views/virtualMachine.view';
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
  VM_IMPORT_TIMEOUT_SECS,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

describe('Test VM actions', () => {
  const leakedResources = new Set<string>();
  const testVM = getVmManifest('URL', testName);

  afterAll(async () => {
    removeLeakedResources(leakedResources);
  });

  describe('Test VM list view kebab actions', () => {
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
        await vm.listViewAction(VMACTIONS.START);
        await fillInput(textFilter, vmName);
        await waitForActionFinished(VMACTIONS.START);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it(
      'Restarts VM',
      async () => {
        await vm.listViewAction(VMACTIONS.RESTART);
        await fillInput(textFilter, vmName);
        await waitForActionFinished(VMACTIONS.RESTART);
      },
      VM_ACTIONS_TIMEOUT_SECS,
    );

    it('Stops VM', async () => {
      await vm.listViewAction(VMACTIONS.STOP);
      await fillInput(textFilter, vmName);
      await waitForActionFinished(VMACTIONS.STOP);
    });

    it('Deletes VM', async () => {
      await vm.listViewAction(VMACTIONS.DELETE);
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
      removeLeakableResource(leakedResources, testVM);
    });
  });
});
