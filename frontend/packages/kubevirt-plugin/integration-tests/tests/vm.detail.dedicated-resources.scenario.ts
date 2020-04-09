import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource, click } from '@console/shared/src/test-utils/utils';
import { isDedicatedCPUPlacement } from '../../src/selectors/vm';
import * as editDedicatedResourcesView from '../views/editDedicatedResourcesView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest } from './utils/mocks';
import { getRandStr, getResourceObject } from './utils/utils';

describe('KubeVirt VM detail - edit Dedicated Resources', () => {
  const testVM = getVMManifest('Container', testName, `dedicatedresourcevm-${getRandStr(5)}`);
  const vm = new VirtualMachine(testVM.metadata);
  const isDedicatedCPU = () =>
    expect(isDedicatedCPUPlacement(getResourceObject(vm.name, vm.namespace, vm.kind)));

  beforeAll(async () => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  it(
    'ID(CNV-3731) enables dedicated resources guaranteed policy, then disables it',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditDedicatedResources();
      await click(editDedicatedResourcesView.guaranteedPolicyCheckbox);
      await click(editDedicatedResourcesView.saveButton);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailDedicatedResources(vm.namespace, vm.name),
          editDedicatedResourcesView.guaranteedPolicyText,
        ),
      );
      isDedicatedCPU().toBeTruthy();

      await vm.modalEditDedicatedResources();
      await click(editDedicatedResourcesView.guaranteedPolicyCheckbox);
      await click(editDedicatedResourcesView.saveButton);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailDedicatedResources(vm.namespace, vm.name),
          editDedicatedResourcesView.noGuaranteedPolicyText,
        ),
      );
      isDedicatedCPU().toBeFalsy();
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
