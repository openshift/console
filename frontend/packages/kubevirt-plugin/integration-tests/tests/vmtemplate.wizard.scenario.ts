import { execSync } from 'child_process';
/* eslint-disable max-nested-callbacks */
import { isEqual } from 'lodash';
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import {
  createResources,
  deleteResource,
  deleteResources,
  removeLeakedResources,
  withResource,
} from '../utils/shared-utils';
import * as templateView from '../views/template.view';
import * as detailView from '../views/virtualMachine.view';
import { flavorConfigs, getTestDataVolume, multusNAD } from './mocks/mocks';
import { getBasicVMTBuilder, VMTemplatePresets } from './mocks/vmBuilderPresets';
import { VirtualMachine } from './models/virtualMachine';
import { VMBuilder } from './models/vmBuilder';
import { VMTemplateBuilder } from './models/vmtemplateBuilder';
import { Wizard } from './models/wizard';
import {
  CNV_25,
  COMMON_TEMPLATES_NAMESPACE,
  VM_BOOTUP_TIMEOUT_SECS,
} from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VMT_ACTION } from './utils/constants/vm';
import { TemplateByName } from './utils/constants/wizard';

describe('Create VM from Template using wizard', () => {
  const leakedResources = new Set<string>();
  const dvName = `testdv-${testName}`;
  const testDataVolume = getTestDataVolume(dvName);
  const wizard = new Wizard();
  const VMTemplateTestCaseIDs = {
    'ID(CNV-871)': VMTemplatePresets[ProvisionSource.CONTAINER.getValue()],
    'ID(CNV-4095)': VMTemplatePresets[ProvisionSource.DISK.getValue()],
    'ID(CNV-1503)': VMTemplatePresets[ProvisionSource.URL.getValue()],
    'ID(CNV-4094)': VMTemplatePresets[ProvisionSource.PXE.getValue()],
  };

  beforeAll(() => {
    createResources([multusNAD, testDataVolume]);
    execSync(`oc wait -n ${testName} --for condition=Ready DataVolume ${dvName} --timeout=100s`);
  });

  afterAll(() => {
    deleteResources([multusNAD, testDataVolume]);
  });

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  for (const [id, vmt] of Object.entries(VMTemplateTestCaseIDs)) {
    const method = vmt.getData().provisionSource.getValue();
    it(
      `${id} Create VM Template using ${method}.`,
      async () => {
        await vmt.create();
        await withResource(leakedResources, vmt.asResource(), async () => {
          const vm = new VMBuilder()
            .setDescription(`VM from template ${vmt.name}`)
            .setNamespace(vmt.namespace)
            .setSelectTemplateName(vmt.name)
            .build();
          await withResource(leakedResources, vm.asResource(), async () => {
            await vm.create();
          });
        });
      },
      VM_BOOTUP_TIMEOUT_SECS * 2,
    );
  }

  // default OS exists only in 2.6+
  if (!CNV_25) {
    it('ID(CNV-5655) Verify common template has workload/flavor pre-defined', async () => {
      const vmTemplate = new VMTemplateBuilder(getBasicVMTBuilder())
        .setName(TemplateByName.RHEL7)
        .setProvisionSource(ProvisionSource.URL)
        .build();

      const vmtName = await vmTemplate.getResourceName();
      const workload = vmtName.split('-')[1];
      const flavor = vmtName.split('-')[2];

      await browser.wait(until.presenceOf(templateView.defaultOSLabel));
      expect(await (templateView.workload(`openshift-${vmtName}`) as any).getText()).toContain(
        workload,
      );
      const detailFlavor = await (templateView.flavor(`openshift-${vmtName}`) as any).getText();
      const flavorText = detailFlavor.toLowerCase();
      expect(flavorText).toContain(flavor);
    });
  }

  it('ID(CNV-1847) Displays correct data on VM Template Details page', async () => {
    const vmt = new VMTemplateBuilder(getBasicVMTBuilder())
      .setProvisionSource(ProvisionSource.URL)
      .build();
    const vmtData = vmt.getData();

    await withResource(leakedResources, vmt.asResource(), async () => {
      await vmt.create();
      await vmt.navigateToDetail();

      const expectation = {
        name: vmtData.name,
        description: vmtData.description,
        os: vmtData.os,
        profile: vmtData.workload.toLowerCase(),
        bootOrder: ['rootdisk (Disk)'],
        flavor: `${vmtData.flavor.flavor}: 1 CPU | 1 GiB Memory`,
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
      .setName(TemplateByName.RHEL8)
      .setProvisionSource(ProvisionSource.URL)
      .build();

    let vm: VirtualMachine;

    afterEach(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-4202) Creates VM using VM Template actions dropdown ', async () => {
      vm = new VMBuilder()
        .setName('vm-from-vmt-detail')
        .setNamespace(testName)
        .setFlavor(flavorConfigs.Tiny)
        .setTemplate(vmTemplate.name)
        .setProvisionSource(ProvisionSource.URL)
        .build();

      await vmTemplate.action(VMT_ACTION.Create);
      await wizard.processWizard(vm.getData());
    });

    it('ID(CNV-4290) Creates VM using VM Template create virtual machine link', async () => {
      vm = new VMBuilder()
        .setName('vm-from-vmt-createlink')
        .setNamespace(testName)
        .setTemplate(vmTemplate.name)
        .setTemplateNamespace(COMMON_TEMPLATES_NAMESPACE)
        .setProvisionSource(ProvisionSource.URL)
        .build();

      await vm.create();
    });
  });
});
