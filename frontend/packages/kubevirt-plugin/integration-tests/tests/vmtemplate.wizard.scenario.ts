/* eslint-disable max-nested-callbacks */
import { isEqual } from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import * as detailView from '../views/virtualMachine.view';
import {
  removeLeakedResources,
  withResource,
  createResources,
  deleteResources,
  deleteResource,
} from '@console/shared/src/test-utils/utils';
import { VM_BOOTUP_TIMEOUT_SECS, NOT_AVAILABLE, VMT_ACTION } from './utils/consts';
import { basicVMConfig, multusNAD } from './utils/mocks';
import { getProvisionConfigs, getTestDataVolume, VMTemplateTestCaseIDs } from './vm.wizard.configs';
import { VirtualMachine } from './models/virtualMachine';
import { VirtualMachineTemplate } from './models/virtualMachineTemplate';
import { ProvisionConfigName, Flavor } from './utils/constants/wizard';
import { Wizard } from './models/wizard';

describe('Create VM from Template using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new Wizard();
  const provisionConfigs = getProvisionConfigs();
  const testDataVolume = getTestDataVolume();
  const commonSettings = {
    cloudInit: {
      useCloudInit: false,
    },
    namespace: testName,
    description: `Default description ${testName}`,
    flavorConfig: basicVMConfig.flavorConfig,
    operatingSystem: basicVMConfig.operatingSystem,
    workloadProfile: basicVMConfig.workloadProfile,
  };
  const vmTemplateConfig = (name, provisionConfig) => {
    return {
      ...commonSettings,
      name: `${name}-${testName}-template`,
      provisionSource: provisionConfig.provision,
      storageResources: provisionConfig.storageResources,
      networkResources: provisionConfig.networkResources,
    };
  };
  const vmConfig = (name, templateConfig) => {
    return {
      ...commonSettings,
      startOnCreation: true,
      name: `${name}-${testName}`,
      template: templateConfig.name,
      provisionSource: templateConfig.provisionSource,
      storageResources: [],
      networkResources: [],
      bootableDevice:
        templateConfig.provisionSource.method === ProvisionConfigName.DISK
          ? testDataVolume.metadata.name
          : undefined,
    };
  };

  beforeAll(() => {
    createResources([multusNAD, testDataVolume]);
  });

  afterAll(() => {
    deleteResources([multusNAD, testDataVolume]);
  });

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  provisionConfigs.forEach((provisionConfig, configName) => {
    it(
      `${VMTemplateTestCaseIDs[configName]} Create VM Template using ${configName}.`,
      async () => {
        const templateCfg = vmTemplateConfig(configName.toLowerCase(), provisionConfig);
        const vmTemplate = await wizard.createVirtualMachineTemplate(templateCfg);
        await withResource(leakedResources, vmTemplate.asResource(), async () => {
          const vm = await wizard.createVirtualMachine(
            vmConfig(configName.toLowerCase(), templateCfg),
          );
          await withResource(leakedResources, vm.asResource(), async () => {
            await vm.navigateToDetail();
          });
        });
      },
      VM_BOOTUP_TIMEOUT_SECS * 2,
    );
  });

  it('ID(CNV-1847) Displays correct data on VM Template Details page', async () => {
    const provisionConfig = provisionConfigs.get(ProvisionConfigName.CONTAINER);
    const templateCfg = vmTemplateConfig(
      provisionConfig.provision.method.toLowerCase(),
      provisionConfig,
    );
    const vmTemplate = await wizard.createVirtualMachineTemplate(templateCfg);
    await withResource(leakedResources, vmTemplate.asResource(), async () => {
      await vmTemplate.navigateToDetail();

      const expectation = {
        name: vmTemplate.name,
        description: templateCfg.description,
        os: templateCfg.operatingSystem,
        profile: templateCfg.workloadProfile,
        bootOrder: ['rootdisk (Disk)'],
        flavor: `${templateCfg.flavorConfig.flavor}: 1 vCPU, 1 GiB Memory`,
        cdrom: NOT_AVAILABLE,
      };

      const found = {
        name: await resourceTitle.getText(),
        description: await detailView.vmDetailDesc(testName, vmTemplate.name).getText(),
        os: await detailView.vmDetailOS(testName, vmTemplate.name).getText(),
        profile: await detailView.vmDetailWorkloadProfile(testName, vmTemplate.name).getText(),
        bootOrder: await detailView.vmDetailBootOrder(testName, vmTemplate.name).getText(),
        flavor: await detailView.vmDetailFlavor(testName, vmTemplate.name).getText(),
        cdrom: await detailView.vmDetailCd(testName, vmTemplate.name).getText(),
      };

      const equal = isEqual(found, expectation);
      if (!equal) {
        // eslint-disable-next-line no-console
        console.error(`Expected:\n${JSON.stringify(expectation)},\nGot:\n${JSON.stringify(found)}`);
      }
      expect(equal).toBe(true);
    });
  });

  describe('Create VM from Template using Template actions', () => {
    const provisionConfig = provisionConfigs.get(ProvisionConfigName.CONTAINER);
    const templateCfg = vmTemplateConfig(
      provisionConfig.provision.method.toLowerCase(),
      provisionConfig,
    );
    const getVMCfg = (name: string) => {
      return {
        name,
        namespace: testName,
        flavorConfig: { flavor: Flavor.TINY },
        storageResources: [],
        networkResources: [],
      };
    };

    let vmTemplate: VirtualMachineTemplate;
    let vm: VirtualMachine;

    beforeAll(async () => {
      vmTemplate = await wizard.createVirtualMachineTemplate(templateCfg);
    });

    afterAll(() => {
      deleteResource(vmTemplate.asResource());
    });

    afterEach(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-4202) Creates VM using VM Template actions dropdown ', async () => {
      const vmCfg = getVMCfg('vm-from-vmt-detail');
      vm = new VirtualMachine(vmCfg);

      await vmTemplate.action(VMT_ACTION.Create);
      await wizard.processWizard(vmCfg);
    });

    it('ID(CNV-4097) Creates VM using VM Template kebab menu ', async () => {
      const vmCfg = getVMCfg('vm-from-vmt-listview');

      vm = new VirtualMachine(vmCfg);
      await vmTemplate.listViewAction(VMT_ACTION.Create);
      await wizard.processWizard(vmCfg);
    });
  });
});
