import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  withResource,
  click,
  fillInput,
  removeLeakedResources,
} from '@console/shared/src/test-utils/utils';
import * as virtualMachineView from '../views/virtualMachine.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { vmConfig, getProvisionConfigs } from './vm.wizard.configs';
import * as editFlavorView from './models/editFlavorView';
import { selectOptionByText, getSelectedOptionText } from './utils/utils';
import { ProvisionConfigName } from './utils/constants/wizard';

describe('KubeVirt VM detail - edit flavor', () => {
  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs();

  const configName = ProvisionConfigName.CONTAINER;
  const provisionConfig = provisionConfigs.get(configName);

  // not needed for testing flavor
  provisionConfig.networkResources = [];
  provisionConfig.storageResources = [];

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  it(
    'ID(CNV-3076) changes tiny to custom',
    async () => {
      const vm1Config = vmConfig(configName.toLowerCase(), testName, provisionConfig);
      vm1Config.startOnCreation = false;

      const vm = new VirtualMachine(vmConfig(configName.toLowerCase(), testName, provisionConfig));
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(vm1Config);
        await vm.navigateToDetail();
        await browser.wait(
          until.textToBePresentInElement(
            virtualMachineView.vmDetailFlavor(vm.namespace, vm.name),
            'Tiny: 1 vCPU, 1 GiB Memory',
          ),
        );
        await vm.modalEditFlavor();
        expect(await getSelectedOptionText(editFlavorView.flavorDropdown)).toEqual('Tiny');
        await selectOptionByText(editFlavorView.flavorDropdown, 'Custom');
        await fillInput(editFlavorView.cpusInput(), '2');
        await fillInput(editFlavorView.memoryInput(), '3');
        await click(editFlavorView.saveButton());

        await browser.wait(
          until.textToBePresentInElement(
            virtualMachineView.vmDetailFlavor(vm.namespace, vm.name),
            'Custom: 2 vCPUs, 3 GiB Memory',
          ),
        );

        expect(
          await virtualMachineView.vmDetailLabelValue('flavor.template.kubevirt.io/Custom'),
        ).toBe('true');
        expect(
          (await virtualMachineView.vmDetailLabelValue('vm.kubevirt.io/template')).startsWith(
            'rhel7-desktop-tiny-', // template is not changed (might be in the future)
          ),
        ).toBeTruthy();
      });
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
