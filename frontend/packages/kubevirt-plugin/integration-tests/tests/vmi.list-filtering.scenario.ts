import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import {
  addLeakableResource,
  createResource,
  removeLeakedResources,
} from '@console/shared/src/test-utils/utils';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { getVMManifest } from './utils/mocks';
import { VM_STATUS } from './utils/consts';
import { filterBoxCount } from '../views/vms.list.view';
import { VirtualMachine } from './models/virtualMachine';

describe('Test List View Filtering (VMI)', () => {
  const leakedResources = new Set<string>();
  const testVM = getVMManifest('Container', testName, `${testName}-vm-test`);
  const testVMI = getVMManifest(
    'Container',
    testName,
    `${testName}-vmi-test`,
    null,
    `VirtualMachineInstance`,
  );

  const vm = new VirtualMachine(testVM.metadata);
  const vmi = new VirtualMachine(testVMI.metadata, 'virtualmachineinstances');

  beforeAll(async () => {
    createResource(testVM);
    addLeakableResource(leakedResources, testVM);
    await vm.waitForStatus(VM_STATUS.Off);

    createResource(testVMI);
    addLeakableResource(leakedResources, testVMI);
    await vmi.waitForStatus(VM_STATUS.Running);

    // Navigate to Virtual Machines page
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();
  });

  afterAll(async () => {
    removeLeakedResources(leakedResources);
  });

  it('Displays correct count of Off VMs', async () => {
    const vmImportingCount = await filterBoxCount(VM_STATUS.Off);
    expect(vmImportingCount).toEqual(1);
  });

  it('Displays correct count of Running VMIs', async () => {
    const vmiImportingCount = await filterBoxCount(VM_STATUS.Running);
    expect(vmiImportingCount).toEqual(1);
  });
});
