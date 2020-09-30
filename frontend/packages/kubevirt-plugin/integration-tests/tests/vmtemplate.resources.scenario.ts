import { find } from 'lodash';
import {
  createResource,
  deleteResource,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { TEMPLATE_ACTIONS_TIMEOUT_SECS } from './utils/constants/common';
import { multusNAD, hddDisk, multusNetworkInterface, provisionSources } from './mocks/mocks';
import { VMTemplateBuilder } from './models/vmtemplateBuilder';
import { getBasicVMTBuilder, getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { VMBuilder } from './models/vmBuilder';
import { Wizard } from './models/wizard';

describe('Test adding/removing discs/nics to/from a VM template', () => {
  const vmt = new VMTemplateBuilder(getBasicVMTBuilder())
    .setProvisionSource(provisionSources.Container)
    .build();

  const wizard = new Wizard();
  const vm = new VMBuilder(getBasicVMBuilder()).setName('from-template').build();

  beforeAll(async () => {
    createResource(multusNAD);
    await vmt.create();
  }, TEMPLATE_ACTIONS_TIMEOUT_SECS);

  afterAll(() => {
    deleteResources([multusNAD, vmt.asResource()]);
  });

  describe('Test adding discs/nics to a VM template', () => {
    beforeAll(async () => {
      await vmt.addDisk(hddDisk);
      await vmt.addNIC(multusNetworkInterface);
      await vmt.createVMFromRowLink();
      await wizard.processWizard(vm.getData());
    }, TEMPLATE_ACTIONS_TIMEOUT_SECS);

    afterAll(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-1849) Adds a disk to a VM template', async () => {
      expect(
        find(await vm.getAttachedDisks(), (disk) => disk.name.startsWith(hddDisk.name)),
      ).toBeDefined();
    });

    it('ID(CNV-1850) Adds a NIC to a VM template', async () => {
      expect(
        find(await vm.getAttachedNICs(), (NIC) => NIC.name.startsWith(multusNetworkInterface.name)),
      ).toBeDefined();
    });
  });

  describe('Test removing discs/nics from a VM template', () => {
    beforeAll(async () => {
      await vmt.removeDisk(hddDisk.name);
      await vmt.removeNIC(multusNetworkInterface.name);
      await vm.create();
    }, TEMPLATE_ACTIONS_TIMEOUT_SECS);

    afterAll(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-4092) Removes a disk from VM template', async () => {
      expect(
        find(await vm.getAttachedDisks(), (disk) => disk.name.startsWith(hddDisk.name)),
      ).not.toBeDefined();
      expect(vm.getAttachedDisks()).not.toContain(hddDisk);
    });

    it('ID(CNV-4091) Removes a NIC from VM template', async () => {
      expect(
        find(await vm.getAttachedNICs(), (NIC) => NIC.name.startsWith(multusNetworkInterface.name)),
      ).not.toBeDefined();
    });
  });
});
