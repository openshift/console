import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResources, deleteResources, click } from '@console/shared/src/test-utils/utils';
import * as editCdView from '../views/dialogs/editCDView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import {
  VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  STORAGE_CLASS,
  NOT_AVAILABLE,
} from './utils/constants/common';
import { selectOptionByOptionValue, getRandStr } from './utils/utils';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest, getTestDataVolume } from './mocks/mocks';

describe('KubeVirt VM detail - edit cdroms', () => {
  const testDataVolume = getTestDataVolume();
  const testVM = getVMManifest('Container', testName, `cdrom-vm-${getRandStr(5)}`);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(() => {
    createResources([testDataVolume, testVM]);
  });

  afterAll(() => {
    deleteResources([testDataVolume, testVM]);
  });

  it(
    'ID(CNV-3104) creates new container CD, then removes it',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditCDRoms();

      await click(editCdView.cdAddBtn);
      await click(saveButton);
      await browser.wait(until.presenceOf(editCdView.diskSummary));

      await vm.modalEditCDRoms();
      await click(editCdView.cdDeleteBtn);
      await click(saveButton);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailCd(vm.namespace, vm.name),
          NOT_AVAILABLE,
        ),
      );
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-3105) creates two new container CDs, then ejects and changes them to URL, PVC',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditCDRoms();

      await click(editCdView.cdAddBtn);
      await click(editCdView.cdAddBtn);
      await click(saveButton);
      await browser.wait(until.presenceOf(editCdView.diskSummary));

      await vm.modalEditCDRoms();
      await selectOptionByOptionValue(editCdView.cdTypeSelect(1), 'url');
      await selectOptionByOptionValue(editCdView.cdStorageClassSelect(1), STORAGE_CLASS);
      await selectOptionByOptionValue(editCdView.cdTypeSelect(2), 'pvc');
      await selectOptionByOptionValue(editCdView.cdPVCSelect(2), testDataVolume.metadata.name);
      await click(saveButton);

      await browser.wait(
        until.textToBePresentInElement(editCdView.diskSummary, testDataVolume.metadata.name),
      );
      await browser.wait(
        until.textToBePresentInElement(editCdView.diskSummary, 'http://path/to/iso'),
      );
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
