/* eslint-disable no-undef, max-nested-callbacks */
import { OrderedMap } from 'immutable';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  removeLeakedResources,
  createResources,
  deleteResources,
  withResource,
} from '@console/shared/src/test-utils/utils';
import { NetworkResource, StorageResource, ProvisionOption } from './utils/types';
import { VM_BOOTUP_TIMEOUT_SECS } from './utils/consts';
import { basicVMConfig, rootDisk, networkInterface, multusNAD, hddDisk } from './utils/mocks';
import { getTestDataVolume } from './vm.wizard.configs';
import { VirtualMachine } from './models/virtualMachine';
import { VirtualMachineTemplate } from './models/virtualMachineTemplate';

describe('Kubevirt create VM Template using wizard', () => {
  const leakedResources = new Set<string>();
  const testDataVolume = getTestDataVolume(testName);
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
      storageResources: [],
      networkResources: [],
    };
  };

  const provisionConfigs = OrderedMap<
    string,
    {
      provision: ProvisionOption;
      networkResources: NetworkResource[];
      storageResources: StorageResource[];
    }
  >()
    .set('URL', {
      provision: {
        method: 'URL',
        source: basicVMConfig.sourceURL,
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk],
    })
    .set('Container', {
      provision: {
        method: 'Container',
        source: basicVMConfig.sourceContainer,
      },
      networkResources: [networkInterface],
      storageResources: [hddDisk],
    })
    .set('PXE', {
      provision: {
        method: 'PXE',
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk],
    });

  beforeAll(async () => {
    createResources([multusNAD, testDataVolume]);
  });

  afterAll(async () => {
    deleteResources([multusNAD, testDataVolume]);
  });

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  provisionConfigs.forEach((provisionConfig, configName) => {
    it(
      `Create VM Template using ${configName}.`,
      async () => {
        const vmTemplate = new VirtualMachineTemplate(
          vmTemplateConfig(configName.toLowerCase(), provisionConfig),
        );
        const vm = new VirtualMachine(vmConfig(configName.toLowerCase(), vmTemplate));

        await withResource(leakedResources, vmTemplate.asResource(), async () => {
          await vmTemplate.create(vmTemplateConfig(configName.toLowerCase(), provisionConfig));
          await withResource(leakedResources, vm.asResource(), async () => {
            await vm.create(vmConfig(configName.toLowerCase(), vmTemplate));
          });
        });
      },
      VM_BOOTUP_TIMEOUT_SECS * 2,
    );
  });
});
