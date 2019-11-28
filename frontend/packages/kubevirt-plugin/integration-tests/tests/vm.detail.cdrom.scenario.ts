import { browser, by, element, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  withResource,
  createResources,
  deleteResources,
  click,
} from '@console/shared/src/test-utils/utils';
import * as editCdView from '../views/editCDView';
import * as virtualMachineView from '../views/virtualMachine.view';
import {
  VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  CONFIG_NAME_CONTAINER,
  STORAGE_CLASS,
} from './utils/consts';
import { selectOptionByOptionValue } from './utils/utils';
import { VirtualMachine } from './models/virtualMachine';
import { vmConfig, getProvisionConfigs, getTestDataVolume } from './vm.wizard.configs';

describe('KubeVirt VM detail - edit cdroms', () => {
  const testDataVolume = getTestDataVolume(testName);

  beforeAll(async () => {
    createResources([testDataVolume]);
  });

  afterAll(async () => {
    deleteResources([testDataVolume]);
  });
  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs(testName);

  const configName = CONFIG_NAME_CONTAINER;
  const provisionConfig = provisionConfigs.get(configName);

  provisionConfig.networkResources = [];
  provisionConfig.storageResources = [];

  it(
    'creates new container CD, then removes it',
    async () => {
      const vm1Config = vmConfig(configName.toLowerCase(), provisionConfig, testName);
      vm1Config.startOnCreation = false;

      const vm = new VirtualMachine(vmConfig(configName.toLowerCase(), provisionConfig, testName));
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(vm1Config);
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
            'Not available',
          ),
        );
      });
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'creates two new container CDs, then ejects and changes them to URL, PVC',
    async () => {
      const vm1Config = vmConfig(configName.toLowerCase(), provisionConfig, testName);
      vm1Config.startOnCreation = false;

      const vm = new VirtualMachine(vmConfig(configName.toLowerCase(), provisionConfig, testName));
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(vm1Config);
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
      });
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
