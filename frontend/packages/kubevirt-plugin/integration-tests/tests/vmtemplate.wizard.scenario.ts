/* eslint-disable max-nested-callbacks */
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  removeLeakedResources,
  withResource,
  createResources,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { VM_BOOTUP_TIMEOUT_SECS } from './utils/consts';
import { basicVMConfig, multusNAD } from './utils/mocks';
import { getProvisionConfigs, getTestDataVolume } from './vm.wizard.configs';
import { VirtualMachine } from './models/virtualMachine';
import { VirtualMachineTemplate } from './models/virtualMachineTemplate';

describe('Kubevirt create VM Template using wizard', () => {
  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs();
  const testDataVolume = getTestDataVolume();
  const commonSettings = {
    cloudInit: {
      useCloudInit: false,
    },
    namespace: testName,
    description: `Default description ${testName}`,
    flavor: basicVMConfig.flavor,
    operatingSystem: basicVMConfig.operatingSystem,
    workloadProfile: basicVMConfig.workloadProfile,
  };
  const vmTemplateConfig = (name, provisionConfig) => {
    return {
      ...commonSettings,
      name: `${name}-${testName}`,
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
      `Create VM Template using ${configName}.`,
      async () => {
        const templateCfg = vmTemplateConfig(configName.toLowerCase(), provisionConfig);
        const vmTemplate = new VirtualMachineTemplate(templateCfg);
        const vmCfg = vmConfig(configName.toLowerCase(), templateCfg);
        const vm = new VirtualMachine(vmCfg);

        await withResource(leakedResources, vmTemplate.asResource(), async () => {
          await vmTemplate.create(templateCfg);
          await withResource(leakedResources, vm.asResource(), async () => {
            await vm.create(vmCfg);
          });
        });
      },
      VM_BOOTUP_TIMEOUT_SECS * 2,
    );
  });
});
