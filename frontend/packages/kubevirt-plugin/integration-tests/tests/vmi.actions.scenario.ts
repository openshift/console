import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { resourceRows } from '@console/internal-integration-tests/views/crud.view';
import {
  addLeakableResource,
  createResource,
  removeLeakedResources,
  removeLeakableResource,
  waitForCount,
} from '@console/shared/src/test-utils/utils';
import { getVMIManifest } from './mocks/mocks';
import { VM_DELETE_TIMEOUT_SECS, VM_IMPORT_TIMEOUT_SECS } from './utils/constants/common';
import { VirtualMachineInstance } from './models/virtualMachineInstance';
import { VM_STATUS, VMI_ACTION } from './utils/constants/vm';
import { BaseVirtualMachine } from './models/baseVirtualMachine';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

const waitForVM = async (manifest: any, status: VM_STATUS, resourcesSet: Set<string>) => {
  const vmi = new VirtualMachineInstance(manifest.metadata);
  createResource(manifest);
  addLeakableResource(resourcesSet, manifest);
  await vmi.waitForStatus(status);
  return vmi;
};

const waitForVMDeleted = async (vm: BaseVirtualMachine) => {
  await vm.navigateToListView();
  await browser.wait(until.and(waitForCount(resourceRows, 0)), VM_DELETE_TIMEOUT_SECS);
};

describe('Test VMI actions', () => {
  const leakedResources = new Set<string>();

  afterAll(async () => {
    removeLeakedResources(leakedResources);
  });

  describe('Test VMI list view kebab dropdown', () => {
    let vmi: VirtualMachineInstance;
    let testVMI: any;

    beforeAll(async () => {
      testVMI = getVMIManifest(ProvisionSource.CONTAINER, testName, `vm-list-actions-${testName}`);
      vmi = await waitForVM(testVMI, VM_STATUS.Running, leakedResources);
    }, VM_IMPORT_TIMEOUT_SECS);

    it('ID(CNV-3693) Deletes VMI', async () => {
      await vmi.navigateToListView();

      await vmi.listViewAction(VMI_ACTION.Delete, false);
      removeLeakableResource(leakedResources, testVMI);
      await waitForVMDeleted(vmi);
    });
  });

  describe('Test VMI detail view actions dropdown', () => {
    let vmi: VirtualMachineInstance;
    let testVMI: any;

    beforeAll(async () => {
      testVMI = getVMIManifest(
        ProvisionSource.CONTAINER,
        testName,
        `vm-detail-actions-${testName}`,
      );
      vmi = await waitForVM(testVMI, VM_STATUS.Running, leakedResources);
    }, VM_IMPORT_TIMEOUT_SECS);

    it('ID(CNV-3699) Deletes VMI', async () => {
      await vmi.action(VMI_ACTION.Delete, false);
      removeLeakableResource(leakedResources, testVMI);
      await waitForVMDeleted(vmi);
    });
  });
});
