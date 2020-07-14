import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import { VirtualMachineInstanceModel } from '../../src/models';
import {
  vmDetailsName,
  vmDetailsNamespace,
  vmDetailsNode,
  vmDetailsIPAddress,
  vmStatus,
  vmInventoryNICs,
  vmInventoryDisks,
} from '../views/dashboard.view';
import { getVMIManifest } from './mocks/mocks';
import { NOT_AVAILABLE } from './utils/constants/common';
import { VirtualMachineInstance } from './models/virtualMachineInstance';
import { VM_STATUS } from './utils/constants/vm';

const waitForVM = async (manifest: any, status: VM_STATUS) => {
  const vm = new VirtualMachineInstance(manifest.metadata);
  createResource(manifest);
  await vm.waitForStatus(status);
  return vm;
};

describe('Test VMI dashboard', () => {
  const testVM = getVMIManifest('Container', testName);
  let vmi: VirtualMachineInstance;

  afterAll(() => {
    deleteResource(testVM);
  });

  beforeAll(async () => {
    vmi = await waitForVM(testVM, VM_STATUS.Running);
    await vmi.navigateToOverview();
  });

  it('ID(CNV-3072) Inventory card', async () => {
    expect(vmInventoryNICs.getText()).toEqual('1 NIC');
    expect(vmInventoryNICs.$('a').getAttribute('href')).toMatch(
      new RegExp(
        `.*/k8s/ns/${vmi.namespace}/${VirtualMachineInstanceModel.plural}/${vmi.name}/nics`,
      ),
    );
    expect(vmInventoryDisks.getText()).toEqual('1 Disk');
    expect(vmInventoryDisks.$('a').getAttribute('href')).toMatch(
      new RegExp(
        `.*/k8s/ns/${vmi.namespace}/${VirtualMachineInstanceModel.plural}/${vmi.name}/disks`,
      ),
    );
  });

  it('ID(CNV-4089) Status card', async () => {
    expect(vmStatus.getText()).toEqual(VM_STATUS.Running);
  });

  it('ID(CNV-4089) Details card', async () => {
    expect(vmDetailsName.getText()).toEqual(vmi.name);
    expect(vmDetailsNamespace.getText()).toEqual(vmi.namespace);
    expect(vmDetailsNode.getText()).not.toEqual(NOT_AVAILABLE);
    expect(vmDetailsIPAddress.getText()).not.toEqual(NOT_AVAILABLE);
  });
});
