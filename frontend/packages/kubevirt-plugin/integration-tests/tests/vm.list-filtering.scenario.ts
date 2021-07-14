import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource } from '../utils/shared-utils';
import { filterCount } from '../views/vms.list.view';
import { getVMManifest } from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import { STORAGE_CLASS, VM_IMPORT_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VM_STATUS } from './utils/constants/vm';

describe('Test List View Filtering', () => {
  const testVM = getVMManifest(ProvisionSource.URL, testName);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(() => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  it('ID(CNV-3614) Displays correct count of importing VMs', async () => {
    if (STORAGE_CLASS === 'ocs-storagecluster-ceph-rbd') {
      await vm.navigateToListView();
      const importingCount = await filterCount(VM_STATUS.Importing);
      expect(importingCount).toEqual(1);
    }
  });

  it('ID(CNV-3615) Displays correct count of Off VMs', async () => {
    await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
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
