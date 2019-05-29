/* eslint-disable no-undef, max-nested-callbacks */
import { OrderedMap } from 'immutable';
import * as _ from 'lodash';

// eslint-disable-next-line no-unused-vars
import { networkResource, provisionOption, addLeakableResource, deleteResource, removeLeakableResource, removeLeakedResources, storageResource, createResource, getResourceObject } from './utils/utils';
import { VM_BOOTUP_TIMEOUT } from './utils/consts';
import { testName } from '../../protractor.conf';
import { basicVmConfig, networkInterface, testNad, rootDisk } from './mocks';
import { VirtualMachine } from './models/virtualMachine';
import { Template } from './models/template';

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
  .set('URL', {
    provision: {
      method: 'URL',
      source: basicVmConfig.sourceURL,
    },
    networkResources: [networkInterface],
    storageResources: [rootDisk],
  })
  .set('Container', {
    provision: {
      method: 'Container',
      source: basicVmConfig.sourceContainer,
    },
    networkResources: [networkInterface],
    storageResources: [],
  })
  .set('PXE', {
    provision: {
      method: 'PXE',
    },
    networkResources: [networkInterface],
    storageResources: [rootDisk],
  });

describe('Kubevirt create VM template using wizard', () => {
  const leakedResources = new Set<string>();

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
    const templateConfig = {
      ...commonSettings,
      name: `tmpl-${provisionConfig.provision.method.toLowerCase()}-${testName}`,
      provisionSource: provisionConfig.provision,
      storageResources: provisionConfig.storageResources,
      networkResources: provisionConfig.networkResources,
    };
    const vmConfig = {
      ...commonSettings,
      name: `vm-${provisionConfig.provision.method.toLowerCase()}-${testName}`,
      template: templateConfig.name,
      storageResources: [],
      networkResources: [],
    };
    const template = new Template(templateConfig);
    const vm = new VirtualMachine(vmConfig);

    it(`Create VM template using ${configName}.`, async() => {
      addLeakableResource(leakedResources, template.asResource());
      await template.create(templateConfig);

      // Verify the template can be used to create VM
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

describe('Test template datavolume cloning', () => {
  const leakedResources = new Set<string>();
  const provisionConfig = provisionConfigs.get('URL');
  const templateConfig = {
    ...commonSettings,
    name: `tmpl-${provisionConfig.provision.method.toLowerCase()}-${testName}`,
    provisionSource: provisionConfig.provision,
    storageResources: provisionConfig.storageResources,
    networkResources: [],
  };
  const vmConfig = {
    ...commonSettings,
    name: `vm-${provisionConfig.provision.method.toLowerCase()}-${testName}`,
    template: templateConfig.name,
    storageResources: [],
    networkResources: [],
  };
  const template = new Template(templateConfig);
  const vm = new VirtualMachine(vmConfig);

  beforeAll(async() => {
    await template.create(templateConfig);
    addLeakableResource(leakedResources, template.asResource());
    await vm.create(vmConfig);
    addLeakableResource(leakedResources, vm.asResource());
  }, VM_BOOTUP_TIMEOUT);

  afterAll(() => {
    deleteResource(vm.asResource());
    removeLeakableResource(leakedResources, vm.asResource());
    deleteResource(template.asResource());
    removeLeakableResource(leakedResources, template.asResource());
  });

  it('Datavolume is cloned for VM created from template', async() => {
    const dataVolumeName = `${vm.name}-${template.name}-${rootDisk.name}-clone`;
    const dataVolumeObject = getResourceObject(dataVolumeName, vm.namespace, 'datavolume');
    const srcPvc = _.get(dataVolumeObject, 'spec.source.pvc.name', undefined);
    expect(srcPvc).toEqual(`${template.name}-${rootDisk.name}`);
  });
});
