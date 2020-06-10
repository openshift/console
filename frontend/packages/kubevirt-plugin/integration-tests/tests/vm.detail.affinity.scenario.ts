import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource, click } from '@console/shared/src/test-utils/utils';
import * as editAffinityView from '../views/dialogs/editAffinityView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest } from './utils/mocks';
import { getRandStr } from './utils/utils';

describe('KubeVirt VM detail - edit Affinity', () => {
  const testVM = getVMManifest('Container', testName, `affinity-vm-${getRandStr(5)}`);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(async () => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  it(
    'ID(CNV-4159) Adds an Affinity, then removes it',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditAffinity();
      await click(editAffinityView.addAffinityBtn);
      await editAffinityView.affinityKeyInputByID(0).sendKeys('key');
      await click(editAffinityView.valuesSelectElement);
      await editAffinityView.valuesSelectElement.sendKeys('affinity-value');
      await click(editAffinityView.createValueBtn);
      await click(editAffinityView.editSubmitBtn);
      await click(saveButton);

      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailAffinity(vm.namespace, vm.name),
          '1 Affinity rules',
        ),
      );

      await vm.modalEditAffinity();
      await click(editAffinityView.kebab);
      await click(editAffinityView.kebabDelete);
      await click(saveButton);

      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailAffinity(vm.namespace, vm.name),
          'No Affinity rules',
        ),
      );
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
