import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource, click } from '@console/shared/src/test-utils/utils';
import * as editNodeSelectorView from '../views/editNodeSelectorView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest } from './utils/mocks';
import { getRandStr } from './utils/utils';

describe('KubeVirt VM detail - edit Node Selector', () => {
  const testVM = getVMManifest('Container', testName, `node-selector-vm-${getRandStr(5)}`);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(async () => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  it(
    'ID(CNV-4133) Adds a Node Selector, then removes it',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditNodeSelector();
      await click(editNodeSelectorView.addLabelBtn);
      await editNodeSelectorView.labelKeyInputByID(0).sendKeys('key');
      await editNodeSelectorView.labelValueInputByID(0).sendKeys('value');
      await click(editNodeSelectorView.submitBtn);

      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailNodeSelector(vm.namespace, vm.name),
          'key=value',
        ),
      );

      await vm.modalEditNodeSelector();
      await click(editNodeSelectorView.deleteBtnByID(0));
      await click(editNodeSelectorView.submitBtn);
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
