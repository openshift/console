import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource, click } from '@console/shared/src/test-utils/utils';
import * as editTolerationsView from '../views/dialogs/editTolerationsView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/constants/common';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest } from './mocks/mocks';
import { getRandStr } from './utils/utils';

describe('KubeVirt VM detail - edit Tolerations', () => {
  const testVM = getVMManifest('Container', testName, `tolerations-vm-${getRandStr(5)}`);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(async () => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  it(
    'ID(CNV-4160) Adds a Toleration, then removes it',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditTolerations();
      await click(editTolerationsView.addLabelBtn);
      await editTolerationsView.tolerationKeyInputByID(0).sendKeys('key');
      await editTolerationsView.tolerationValueInputByID(0).sendKeys('value');
      await click(saveButton);

      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailTolerations(vm.namespace, vm.name),
          '1 Toleration rules',
        ),
      );

      await vm.modalEditTolerations();
      await click(editTolerationsView.deleteBtnByID(0));
      await click(saveButton);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailTolerations(vm.namespace, vm.name),
          'No Toleration rules',
        ),
      );
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
