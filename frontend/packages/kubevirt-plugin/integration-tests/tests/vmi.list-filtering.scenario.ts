import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResources } from '@console/shared/src/test-utils/utils';
import { getVMManifest, getVMIManifest } from './mocks/mocks';
import { VM_STATUS } from './utils/constants/vm';
import { filterCount } from '../views/vms.list.view';
import { VirtualMachineInstance } from './models/virtualMachineInstance';

const waitForVM = async (manifest: any, status: VM_STATUS) => {
  const vmi = new VirtualMachineInstance(manifest.metadata);
  createResource(manifest);
  await vmi.waitForStatus(status);
  return vmi;
};

describe('Test List View Filtering (VMI)', () => {
  const testVM = getVMManifest('Container', testName, `${testName}-vm-test`);
  const testVMI = getVMIManifest('Container', testName, `${testName}-vmi-test`);

  beforeAll(async () => {
    await waitForVM(testVM, VM_STATUS.Off);
    const vmi = await waitForVM(testVMI, VM_STATUS.Running);
    await vmi.navigateToListView();
  });

  afterAll(async () => {
    deleteResources([testVM, testVMI]);
  });

  it('ID(CNV-3701) Displays correct count of Off VMs', async () => {
    const vmImportingCount = await filterCount(VM_STATUS.Off);
    expect(vmImportingCount).toEqual(1);
  });

  it('ID(CNV-3700) Displays correct count of Running VMIs', async () => {
    const vmiImportingCount = await filterCount(VM_STATUS.Running);
    expect(vmiImportingCount).toEqual(1);
  });
});
