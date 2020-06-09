import { browser, by, element, ExpectedConditions as until } from 'protractor';
import { createResource, deleteResource, click } from '@console/shared/src/test-utils/utils';
import * as editCdView from '../views/dialogs/editCDView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS, STORAGE_CLASS, NOT_AVAILABLE } from './utils/consts';
import { selectOptionByOptionValue } from './utils/utils';
import { getTestDataVolume } from './vm.wizard.configs';
import { vm } from './vm.setup.scenario';

describe('KubeVirt VM detail - edit cdroms', () => {
  const testDataVolume = getTestDataVolume();

  beforeAll(() => {
    createResource(testDataVolume);
  });

  afterAll(() => {
    deleteResource(testDataVolume);
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
    'ID(CNV-3105) creates two new container CDs, then changes them to URL, PVC',
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
        until.textToBePresentInElement(
          virtualMachineView.vmDetailCd(vm.namespace, vm.name),
          testDataVolume.metadata.name,
        ),
      );
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailCd(vm.namespace, vm.name),
          'http://path/to/iso',
        ),
      );

      // clean up CD-ROMs
      await vm.modalEditCDRoms();
      await element
        .all(by.css(editCdView.cdDeleteBtn))
        .then((cdroms) => cdroms.forEach((cdrom) => click(cdrom)));

      await click(saveButton);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
