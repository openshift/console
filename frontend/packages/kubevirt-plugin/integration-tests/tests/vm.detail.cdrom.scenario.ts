import { browser, by, element, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  createResources,
  deleteResources,
  createResource,
  deleteResource,
  click,
} from '@console/shared/src/test-utils/utils';
import * as editCdView from '../views/editCDView';
import * as virtualMachineView from '../views/virtualMachine.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS, STORAGE_CLASS, NOT_AVAILABLE } from './utils/consts';
import { selectOptionByOptionValue, getRandStr } from './utils/utils';
import { VirtualMachine } from './models/virtualMachine';
import { getTestDataVolume } from './vm.wizard.configs';
import { getVMManifest } from './utils/mocks';

describe('KubeVirt VM detail - edit cdroms', () => {
  const testDataVolume = getTestDataVolume();
  let testVM;
  let vm;

  beforeAll(() => {
    createResources([testDataVolume]);
  });

  afterAll(() => {
    deleteResources([testDataVolume]);
  });

  beforeEach(() => {
    testVM = getVMManifest('Container', testName, `bootordervm-${getRandStr(5)}`);
    createResource(testVM);
    vm = new VirtualMachine(testVM.metadata);
  });

  afterEach(() => {
    deleteResource(vm.asResource());
  });

  it(
    'creates new container CD, then removes it',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditCDRoms();

      await click(editCdView.cdAddBtn);
      await click(editCdView.saveButton);
      await browser.wait(until.presenceOf(editCdView.diskSummary));

      await vm.modalEditCDRoms();
      await click(editCdView.cdDeleteBtn);
      await click(editCdView.saveButton);
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
    'creates two new container CDs, then ejects and changes them to URL, PVC',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditCDRoms();

      await click(editCdView.cdAddBtn);
      await click(editCdView.cdAddBtn);
      await click(editCdView.saveButton);
      await browser.wait(until.presenceOf(editCdView.diskSummary));

      await vm.modalEditCDRoms();
      await element
        .all(by.css(editCdView.cdEjectBtn))
        .then((ejects) => ejects.forEach((eject) => click(eject)));
      await selectOptionByOptionValue(editCdView.cdTypeSelect(1), 'url');
      await selectOptionByOptionValue(editCdView.cdStorageClassSelect(1), STORAGE_CLASS);
      await selectOptionByOptionValue(editCdView.cdTypeSelect(2), 'pvc');
      await selectOptionByOptionValue(editCdView.cdPVCSelect(2), testDataVolume.metadata.name);
      await click(editCdView.saveButton);

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
