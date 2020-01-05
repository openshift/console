// import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  withResource,
  click,
} from '@console/shared/src/test-utils/utils';
import * as editBootOrderView from '../views/editBootOrderView';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { vmConfig, getProvisionConfigs } from './vm.wizard.configs';
import { ProvisionConfigName, Flavor } from './utils/constants/wizard';

describe('KubeVirt VM detail - edit boot order', () => {
  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs();

  const configName = ProvisionConfigName.CONTAINER;
  const provisionConfig = provisionConfigs.get(configName);

  provisionConfig.networkResources = [];
  provisionConfig.storageResources = [];

  it(
    'delete boot device',
    async () => {
      const vm1Config = vmConfig(configName.toLowerCase(), testName, provisionConfig);
      vm1Config.startOnCreation = false;
      vm1Config.flavor = Flavor.MEDIUM;

      const vm = new VirtualMachine(vmConfig(configName.toLowerCase(), testName, provisionConfig));
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(vm1Config);
        await vm.navigateToDetail();

        // Check for 2 boot devices
        expect(await editBootOrderView.bootOrderSummaryList(vm.namespace, vm.name).length).toEqual(2);

        await vm.modalEditBootOrder();
        await click(editBootOrderView.deleteDeviceButton(1));
        await click(editBootOrderView.saveButton);

        // Check for 1 boot devices
        ///expect(await editBootOrderView.bootOrderSummaryList(vm.namespace, vm.name).length).toEqual(1);
      });
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
