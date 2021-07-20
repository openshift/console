import { browser, ExpectedConditions as until } from 'protractor';
import { isDedicatedCPUPlacement } from '../../src/selectors/vm';
import { click, removeLeakedResources, withResource } from '../utils/shared-utils';
import * as editDedicatedResourcesView from '../views/dialogs/editDedicatedResourcesView';
import { saveButton } from '../views/kubevirtUIResource.view';
import * as virtualMachineView from '../views/virtualMachine.view';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { VMBuilder } from './models/vmBuilder';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

describe('KubeVirt VM detail - edit Dedicated Resources', () => {
  const leakedResources = new Set<string>();
  const vm = new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.URL)
    .setStartOnCreation(false)
    .build();

  const isDedicatedCPU = () => expect(isDedicatedCPUPlacement(vm.getResource()));

  afterAll(() => {
    removeLeakedResources(leakedResources);
  });

  it(
    'ID(CNV-3731) Enables dedicated resources guaranteed policy, then disables it',
    async () => {
      await vm.create();
      await withResource(leakedResources, vm.asResource(), async () => {
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
      });
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
