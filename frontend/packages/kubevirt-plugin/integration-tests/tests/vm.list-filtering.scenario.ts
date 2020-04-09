import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import { getVMManifest } from './utils/mocks';
import { VM_STATUS, VM_ACTION } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { filterBoxCount } from '../views/vms.list.view';

describe('Test List View Filtering', () => {
  const testVM = getVMManifest('URL', testName);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(async () => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  it('ID(CNV-3614) Displays correct count of Importing VMs', async () => {
    await vm.waitForStatus(VM_STATUS.Importing);
    await vm.navigateToListView();
    const importingCount = await filterBoxCount(VM_STATUS.Importing);
    expect(importingCount).toEqual(1);
  });

  it('ID(CNV-3615) Displays correct count of Off VMs', async () => {
    await vm.waitForStatus(VM_STATUS.Off);
    await vm.navigateToListView();
    const offCount = await filterBoxCount(VM_STATUS.Off);
    expect(offCount).toEqual(1);
  });

  it('ID(CNV-3616) Displays correct count of Running VMs', async () => {
    await vm.action(VM_ACTION.Start);
    await vm.navigateToListView();
    const runningCount = await filterBoxCount(VM_STATUS.Running);
    expect(runningCount).toEqual(1);
  });
});
