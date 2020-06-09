import { browser, ExpectedConditions as until } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';
import * as editNodeSelectorView from '../views/editNodeSelectorView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { vm } from './vm.setup.scenario';

describe('KubeVirt VM detail - edit Node Selector', () => {
  it(
    'ID(CNV-4133) Adds a Node Selector, then removes it',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditNodeSelector();
      await click(editNodeSelectorView.addLabelBtn);
      await editNodeSelectorView.labelKeyInputByID(0).sendKeys('key');
      await editNodeSelectorView.labelValueInputByID(0).sendKeys('value');
      await click(saveButton);

      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailNodeSelector(vm.namespace, vm.name),
          'key=value',
        ),
      );

      await vm.modalEditNodeSelector();
      await click(editNodeSelectorView.deleteBtnByID(0));
      await click(saveButton);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailNodeSelector(vm.namespace, vm.name),
          'No selector',
        ),
      );
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
