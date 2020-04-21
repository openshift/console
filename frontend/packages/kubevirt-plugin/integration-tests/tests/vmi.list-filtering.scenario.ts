import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResources } from '@console/shared/src/test-utils/utils';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { getVMManifest, getVMIManifest } from './utils/mocks';
import { VM_STATUS } from './utils/consts';
import { filterBoxCount } from '../views/vms.list.view';
import { VirtualMachine } from './models/virtualMachine';

const waitForVM = async (
  manifest: any,
  status: VM_STATUS,
  kind?: 'virtualmachines' | 'virtualmachineinstances',
) => {
  const vm = new VirtualMachine(manifest.metadata, kind || 'virtualmachines');

  createResource(manifest);
  await vm.waitForStatus(status);
};

const waitForVMList = async () => {
  await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
  await isLoaded();
};

describe('Test List View Filtering (VMI)', () => {
  const testVM = getVMManifest('Container', testName, `${testName}-vm-test`);
  const testVMI = getVMIManifest('Container', testName, `${testName}-vmi-test`);

  beforeAll(async () => {
    await waitForVM(testVM, VM_STATUS.Off);
    await waitForVM(testVMI, VM_STATUS.Running, 'virtualmachineinstances');

    await waitForVMList();
  });

  afterAll(async () => {
    deleteResources([testVM, testVMI]);
  });

  it('ID(CNV-3701) Displays correct count of Off VMs', async () => {
    const vmImportingCount = await filterBoxCount(VM_STATUS.Off);
    expect(vmImportingCount).toEqual(1);
  });

  it('ID(CNV-3700) Displays correct count of Running VMIs', async () => {
    const vmiImportingCount = await filterBoxCount(VM_STATUS.Running);
    expect(vmiImportingCount).toEqual(1);
  });
});
