import {
  createResource,
  deleteResource,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { TEMPLATE_ACTIONS_TIMEOUT_SECS } from './utils/consts';
import { basicVMConfig, multusNAD, hddDisk, multusNetworkInterface } from './utils/mocks';
import { getProvisionConfigs } from './vm.wizard.configs';
import { VirtualMachine } from './models/virtualMachine';
import { VirtualMachineTemplate } from './models/virtualMachineTemplate';
import { ProvisionConfig } from './utils/types';
import { ProvisionConfigName } from './utils/constants/wizard';

describe('Test adding/removing discs/nics to/from a VM template', () => {
  const provisionConfigContainer = getProvisionConfigs().get(ProvisionConfigName.CONTAINER);
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
  const vmTemplateConfig = (name: string, provisionConfig: ProvisionConfig) => {
    return {
      ...commonSettings,
      name,
      provisionSource: provisionConfig.provision,
      storageResources: [],
      networkResources: [],
    };
  };
  const vmConfig = (name: string, templateConfig) => {
    return {
      ...commonSettings,
      startOnCreation: true,
      name,
      template: templateConfig.name,
      provisionSource: templateConfig.provisionSource,
      storageResources: [],
      networkResources: [],
    };
  };

  const templateCfg = vmTemplateConfig(
    `tmpl-${provisionConfigContainer.provision.method.toLowerCase()}`,
    provisionConfigContainer,
  );
  const vmTemplate = new VirtualMachineTemplate(templateCfg);

  const vmCfg = vmConfig(`vmfromtmpl-${vmTemplate.name}`, templateCfg);
  const vm = new VirtualMachine(vmCfg);

  beforeAll(async () => {
    createResource(multusNAD);
    await vmTemplate.create(templateCfg);
  }, TEMPLATE_ACTIONS_TIMEOUT_SECS);

  afterAll(() => {
    deleteResources([multusNAD, vmTemplate.asResource()]);
  });

  describe('Test adding discs/nics to a VM template', () => {
    vmCfg.startOnCreation = false;

    beforeAll(async () => {
      await vmTemplate.addDisk(hddDisk);
      await vmTemplate.addNIC(multusNetworkInterface);
      await vm.create(vmCfg);
    }, TEMPLATE_ACTIONS_TIMEOUT_SECS);

    afterAll(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-1849) Adds a disk to a VM template', async () => {
      expect(vm.getAttachedDisks()).toContain(hddDisk);
    });

    it('ID(CNV-1850) Adds a NIC to a VM template', async () => {
      expect(vm.getAttachedNICs()).toContain(multusNetworkInterface);
    });
  });

  describe('Test removing discs/nics from a VM template', () => {
    beforeAll(async () => {
      await vmTemplate.removeDisk(hddDisk.name);
      await vmTemplate.removeNIC(multusNetworkInterface.name);
      await vm.create(vmCfg);
    }, TEMPLATE_ACTIONS_TIMEOUT_SECS);

    afterAll(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-4092) Removes a disk from VM template', async () => {
      expect(vm.getAttachedDisks()).not.toContain(hddDisk);
    });

    it('ID(CNV-4091) Removes a NIC from VM template', async () => {
      expect(vm.getAttachedNICs()).not.toContain(multusNetworkInterface);
    });
  });
});
