import { $ } from 'protractor';
import { testName } from '../../protractor.conf';

import { createResource, click, fillInput, getInputValue, selectDropdownOption, deleteResource, addLeakableResource, removeLeakableResource } from './utils/utils';
import { testNad, networkInterface, basicVmConfig, hddDisk } from './mocks';
import { vmDetailDesc as detailDesc, vmDetailName as detailName, vmDetailOS as detailOS, detailViewEditBtn, detailViewSaveBtn,
  vmDetailFlavorDropdownId as detailFlavorDropdownId, vmDetailFlavorCPU as detailFlavorCPU, vmDetailFlavorMemory as detailFlavorMemory } from '../../views/kubevirt/virtualMachine.view';
import { VM_ACTIONS_TIMEOUT, TABS } from './utils/consts';
import { Template } from './models/template';
import { VirtualMachine } from './models/virtualMachine';
import { resourceTitle } from '../../views/crud.view';
import { provisionSourceDropdownId, operatingSystemDropdownId, flavorDropdownId, customFlavorCpus, customFlavorMemory } from '../../views/kubevirt/wizard.view';
import Wizard from './models/wizard';


describe('Test adding discs/nics to template', () => {
  const leakedResources = new Set<string>();
  const commonConfig = {
    namespace: testName,
    description: `Default description ${testName}`,
    flavor: basicVmConfig.flavor,
    cloudInit: {
      useCloudInit: false,
    },
    storageResources: [],
    networkResources: [],
  };

  const templateConfig = {
    ...commonConfig,
    name: `template-${testName}`,
    provisionSource: {
      method: 'Container',
      source: basicVmConfig.sourceContainer,
    },
    operatingSystem: basicVmConfig.operatingSystem,
    workloadProfile: basicVmConfig.workloadProfile,
  };
  const vmConfig = {
    ...commonConfig,
    name: `vm-${testName}`,
    template: templateConfig.name,
    startOnCreation: false,
  };
  const template = new Template(templateConfig);
  const vm = new VirtualMachine(vmConfig);
  const wizard = new Wizard();

  beforeAll(async() => {
    createResource(testNad);
    await template.create(templateConfig);
  });

  afterAll(() => {
    deleteResource(testNad);
    deleteResource(template.asResource());
  });

  it('Add/remove disk to template', async() => {
    await template.addDisk(hddDisk);
    await vm.create(vmConfig);
    addLeakableResource(leakedResources, vm.asResource());
    const addedDisk = (await vm.getAttachedDisks()).find(disk => disk.name === hddDisk.name);
    expect(addedDisk).toEqual(hddDisk);

    deleteResource(vm.asResource());
    removeLeakableResource(leakedResources, vm.asResource());
  }, VM_ACTIONS_TIMEOUT);

  it('Add/remove nic to template', async() => {
    await template.addNic(networkInterface);
    await vm.create(vmConfig);
    addLeakableResource(leakedResources, vm.asResource());
    const addedNic = (await vm.getAttachedNics()).find(nic => nic.name === networkInterface.name);
    expect(addedNic).toEqual(networkInterface);

    deleteResource(vm.asResource());
    removeLeakableResource(leakedResources, vm.asResource());
  }, VM_ACTIONS_TIMEOUT);

  it('Test template Overview page', async() => {
    const customFlavorName = 'Custom';
    const customFlavorResources = '1';

    await template.navigateToTab(TABS.OVERVIEW);
    expect(resourceTitle.getText()).toEqual(template.name);
    expect(detailName(template.namespace, template.name).getText()).toEqual(template.name);
    expect(detailDesc(template.namespace, template.name).getText()).toEqual(templateConfig.description);
    expect(detailOS(template.namespace, template.name).getText()).toEqual(templateConfig.operatingSystem);

    await click(detailViewEditBtn);
    await selectDropdownOption(detailFlavorDropdownId(template.namespace, template.name), customFlavorName);
    await fillInput(detailFlavorCPU(template.namespace, template.name), customFlavorResources);
    await fillInput(detailFlavorMemory(template.namespace, template.name), customFlavorResources);
    await click(detailViewSaveBtn);

    await vm.navigateToListView();
    await wizard.openWizard();
    await wizard.selectTemplate(template.name);
    expect($(provisionSourceDropdownId).getText()).toEqual(templateConfig.provisionSource.method);
    expect($(operatingSystemDropdownId).getText()).toEqual(templateConfig.operatingSystem);
    expect($(flavorDropdownId).getText()).toEqual(customFlavorName);
    expect(getInputValue($(customFlavorCpus))).toEqual(customFlavorResources);
    expect(getInputValue($(customFlavorMemory))).toEqual(customFlavorResources);
  }, VM_ACTIONS_TIMEOUT);

});
