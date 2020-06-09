import { browser, ExpectedConditions as until } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';
import { isDedicatedCPUPlacement } from '../../src/selectors/vm';
import * as editDedicatedResourcesView from '../views/dialogs/editDedicatedResourcesView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { vm } from './vm.setup.scenario';

describe('KubeVirt VM detail - edit Dedicated Resources', () => {
  const isDedicatedCPU = () => expect(isDedicatedCPUPlacement(vm.getResource()));

  it(
    'ID(CNV-3731) enables dedicated resources guaranteed policy, then disables it',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditDedicatedResources();
      await click(editDedicatedResourcesView.guaranteedPolicyCheckbox);
      await click(saveButton);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailDedicatedResources(vm.namespace, vm.name),
          editDedicatedResourcesView.guaranteedPolicyText,
        ),
      );
      isDedicatedCPU().toBeTruthy();

      await vm.modalEditDedicatedResources();
      await click(editDedicatedResourcesView.guaranteedPolicyCheckbox);
      await click(saveButton);
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
