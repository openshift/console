import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import { getVMManifest } from './mocks/mocks';
import { PAGE_LOAD_TIMEOUT_SECS } from './utils/constants/common';
import { VM_ACTION, VM_STATUS } from './utils/constants/vm';
import { VirtualMachine } from './models/virtualMachine';
import { filterCount } from '../views/vms.list.view';
import { browser } from 'protractor';
import { waitForFilterCount } from './utils/utils';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

describe('Test List View Filtering', () => {
  const testVM = getVMManifest(ProvisionSource.URL, testName);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(() => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  it('ID(CNV-3614) Displays correct count of Pending VMs', async () => {
    await vm.navigateToListView();
    await vm.action(VM_ACTION.Start, false);
    await browser.wait(waitForFilterCount(VM_STATUS.Pending, 1), PAGE_LOAD_TIMEOUT_SECS);
    const importingCount = await filterCount(VM_STATUS.Pending);
    expect(importingCount).toEqual(1);
    await vm.waitForStatus(VM_STATUS.Running);
  });

  it('ID(CNV-3615) Displays correct count of Off VMs', async () => {
    await vm.stop();
    await vm.navigateToListView();
    const offCount = await filterCount(VM_STATUS.Off);
    expect(offCount).toEqual(1);
  });

  it('ID(CNV-3616) Displays correct count of Running VMs', async () => {
    await vm.start();
    await vm.navigateToListView();
    const runningCount = await filterCount(VM_STATUS.Running);
    expect(runningCount).toEqual(1);
  });
});
