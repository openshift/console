import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import {
  addLeakableResource,
  createResource,
  removeLeakedResources,
  removeLeakableResource,
} from '@console/shared/src/test-utils/utils';
import {
  resourceRowsPresent,
  textFilter,
  isLoaded,
} from '@console/internal-integration-tests/views/crud.view';
import { getVMManifest, getVMIManifest } from './utils/mocks';
import { VM_STATUS } from './utils/consts';
import { filterBoxCount } from '../views/vms.list.view';
import { VirtualMachine } from './models/virtualMachine';
import { fillInput } from './utils/utils';

const waitForVM = async (
  manifest: any,
  status: VM_STATUS,
  resourcesSet: Set<string>,
  kind?: 'virtualmachines' | 'virtualmachineinstances',
) => {
  const vm = new VirtualMachine(manifest.metadata, kind || 'virtualmachines');

  createResource(manifest);
  addLeakableResource(resourcesSet, manifest);
  await vm.waitForStatus(status);
};

const waitForVMList = async () => {
  await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
  await isLoaded();
};

describe('Test List View Filtering (VMI)', () => {
  const leakedResources = new Set<string>();
  const testVM = getVMManifest('Container', testName, `${testName}-vm-test`);
  const testVMI = getVMIManifest('Container', testName, `${testName}-vmi-test`);

  beforeAll(async () => {
    await waitForVM(testVM, VM_STATUS.Off, leakedResources);
    await waitForVM(testVMI, VM_STATUS.Running, leakedResources, 'virtualmachineinstances');

    await waitForVMList();
  });

  afterAll(async () => {
    removeLeakableResource(leakedResources, testVM);
    removeLeakableResource(leakedResources, testVMI);
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

  it('Displays VMs in the list of VirtualMachines', async () => {
    await fillInput(textFilter, testVM.metadata.name);
    await resourceRowsPresent();
  });

  it('Displays VMIs in the list of VirtualMachines', async () => {
    await fillInput(textFilter, testVMI.metadata.name);
    await resourceRowsPresent();
  });
});
