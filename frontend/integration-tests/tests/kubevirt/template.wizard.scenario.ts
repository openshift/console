/* eslint-disable no-undef, max-nested-callbacks */
import { OrderedMap } from 'immutable';

// eslint-disable-next-line no-unused-vars
import { networkResource, provisionOption, addLeakableResource, deleteResource, removeLeakableResource, removeLeakedResources, storageResource, createResource } from './utils/utils';
import { VM_BOOTUP_TIMEOUT } from './utils/consts';
import { testName } from '../../protractor.conf';
import { basicVmConfig, glusterfsDisk, networkInterface, testNad, rootDisk } from './mocks';
import { VirtualMachine } from './models/virtualMachine';
import { Template } from './models/template';

describe('Kubevirt create VM template using wizard', () => {
  const leakedResources = new Set<string>();
  const commonSettings = {
    startOnCreation: true,
    cloudInit: {
      useCloudInit: false,
    },
    namespace: testName,
    description: `Default description ${testName}`,
    flavor: basicVmConfig.flavor,
    operatingSystem: basicVmConfig.operatingSystem,
    workloadProfile: basicVmConfig.workloadProfile,
  };
  const provisionConfigs = OrderedMap<string, {provision: provisionOption, networkResources: networkResource[], storageResources: storageResource[]}>()
    .set('URL (+2 disks, +1 NIC)', {
      provision: {
        method: 'URL',
        source: basicVmConfig.sourceURL,
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk, glusterfsDisk],
    })
    .set('Container (+2 disks, +1 NIC)', {
      provision: {
        method: 'Container',
        source: basicVmConfig.sourceContainer,
      },
      networkResources: [networkInterface],
      storageResources: [glusterfsDisk],
    })
    .set('PXE (+2 disks, +1 NIC)', {
      provision: {
        method: 'PXE',
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk, glusterfsDisk],
    });

  beforeAll(async() => {
    createResource(testNad);
  });

  afterAll(async() => {
    deleteResource(testNad);
  });

  afterEach(async() => {
    removeLeakedResources(leakedResources);
  });

  provisionConfigs.forEach((provisionConfig, configName) => {
    it(`Create VM template using ${configName}.`, async() => {
      const templateConfig = {
        name: `tmpl-${provisionConfig.provision.method.toLowerCase()}-${testName}`,
        provisionSource: provisionConfig.provision,
        storageResources: provisionConfig.storageResources,
        networkResources: provisionConfig.networkResources,
        ...commonSettings,
      };
      const template = new Template(templateConfig.name, templateConfig.namespace);

      addLeakableResource(leakedResources, template.asResource());
      await template.create(templateConfig);

      // Verify the template can be used to create VM
      const vmConfig = {
        name: `vm-${provisionConfig.provision.method.toLowerCase()}-${testName}`,
        template: templateConfig.name,
        storageResources: [],
        networkResources: [],
        ...commonSettings,
      };
      const vm = new VirtualMachine(vmConfig.name, vmConfig.namespace);

      addLeakableResource(leakedResources, vm.asResource());
      await vm.create(vmConfig);

      // Remove VM
      deleteResource(vm.asResource());
      removeLeakableResource(leakedResources, vm.asResource());

      // Remove template
      deleteResource(template.asResource());
      removeLeakableResource(leakedResources, template.asResource());

    }, VM_BOOTUP_TIMEOUT * 2);
  });
});
