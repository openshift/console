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
import { VM_BOOTUP_TIMEOUT_SECS } from './utils/constants/common';
import { multusNAD, getTestDataVolume, flavorConfigs, provisionSources } from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import { ProvisionSource, OperatingSystem, Workload } from './utils/constants/wizard';
import { Wizard } from './models/wizard';
import { VMT_ACTION } from './utils/constants/vm';
import { VMTemplateBuilder } from './models/vmtemplateBuilder';
import { getBasicVMTBuilder, VMTemplatePresets } from './mocks/vmBuilderPresets';
import { VMBuilder } from './models/vmBuilder';

describe('Create VM from Template using wizard', () => {
  const leakedResources = new Set<string>();
  const testDataVolume = getTestDataVolume();
  const wizard = new Wizard();
  const VMTemplateTestCaseIDs = {
    'ID(CNV-871)': VMTemplatePresets[ProvisionSource.CONTAINER],
    'ID(CNV-4095)': VMTemplatePresets[ProvisionSource.DISK],
    'ID(CNV-1503)': VMTemplatePresets[ProvisionSource.URL],
    'ID(CNV-4094)': VMTemplatePresets[ProvisionSource.PXE],
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

  for (const [id, vmt] of Object.entries(VMTemplateTestCaseIDs)) {
    const { method } = vmt.getData().provisionSource;
    it(
      `${id} Create VM Template using ${method}.`,
      async () => {
        await vmt.create();
        await withResource(leakedResources, vmt.asResource(), async () => {
          const vm = new VMBuilder()
            .setNamespace(testName)
            .setDescription(`VM from template ${vmt.name}`)
            .setFlavor(flavorConfigs.Tiny)
            .setDisks(vmt.getData().disks)
            .build();
          await withResource(leakedResources, vm.asResource(), async () => {
            await vmt.createVMFromRowLink();
            await wizard.processWizard(vm.getData());
          });
        });
      },
      VM_BOOTUP_TIMEOUT_SECS * 2,
    );
  }

  it('ID(CNV-1847) Displays correct data on VM Template Details page', async () => {
    const vmt = new VMTemplateBuilder(getBasicVMTBuilder())
      .setProvisionSource(provisionSources.Container)
      .build();
    const vmtData = vmt.getData();

    await withResource(leakedResources, vmt.asResource(), async () => {
      await vmt.create();
      await vmt.navigateToDetail();

      const expectation = {
        name: vmtData.name,
        description: vmtData.description,
        os: vmtData.os,
        profile: vmtData.workload,
        bootOrder: ['rootdisk (Disk)'],
        flavor: `${vmtData.flavor.flavor}: 1 vCPU, 1 GiB Memory`,
      };

      const found = {
        name: await resourceTitle.getText(),
        description: await detailView.vmDetailDesc(testName, vmt.name).getText(),
        os: await detailView.vmDetailOS(testName, vmt.name).getText(),
        profile: await detailView.vmDetailWorkloadProfile(testName, vmt.name).getText(),
        bootOrder: await detailView.vmDetailBootOrder(testName, vmt.name).getText(),
        flavor: await detailView.vmDetailFlavor(testName, vmt.name).getText(),
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
    const vmTemplate = new VMTemplateBuilder(getBasicVMTBuilder())
      .setProvisionSource(provisionSources.Container)
      .setOS(OperatingSystem.RHEL7)
      .setWorkload(Workload.DESKTOP)
      .build();
    let vm: VirtualMachine;

    beforeAll(async () => {
      await vmTemplate.create();
    });

    afterAll(() => {
      deleteResource(vmTemplate.asResource());
    });

    afterEach(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-4202) Creates VM using VM Template actions dropdown ', async () => {
      vm = new VMBuilder()
        .setName('vm-from-vmt-detail')
        .setNamespace(testName)
        .setFlavor(flavorConfigs.Tiny)
        .build();

      await vmTemplate.action(VMT_ACTION.Create);
      await wizard.processWizard(vm.getData());
    });

    it('ID(CNV-4097) Creates VM using VM Template kebab menu ', async () => {
      vm = new VMBuilder()
        .setName('vm-from-vmt-list')
        .setNamespace(testName)
        .setFlavor(flavorConfigs.Tiny)
        .build();

      await vmTemplate.listViewAction(VMT_ACTION.Create);
      await wizard.processWizard(vm.getData());
    });

    it('ID(CNV-4290) Creates VM using VM Template create virtual machine link', async () => {
      vm = new VMBuilder()
        .setName('vm-from-vmt-createlink')
        .setNamespace(testName)
        .setFlavor(flavorConfigs.Tiny)
        .build();

      await vmTemplate.createVMFromRowLink();
      await wizard.processWizard(vm.getData());
    });
  });
});
