import { $ } from 'protractor';
import { testName } from '../../protractor.conf';
import { testNad, networkInterface, basicVmConfig, hddDisk } from './mocks';
import { createResource, click, fillInput, getInputValue, selectDropdownOption, deleteResource, addLeakableResource, removeLeakableResource } from './utils/utils';
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
    name: `template-${testName}`,
    provisionSource: {
      method: 'Container',
      source: basicVmConfig.sourceContainer,
    },
    operatingSystem: basicVmConfig.operatingSystem,
    workloadProfile: basicVmConfig.workloadProfile,
    ...commonConfig,
  };
  const vmConfig = {
    name: `vm-${testName}`,
    template: templateConfig.name,
    startOnCreation: false,
    ...commonConfig,
  };
  const template = new Template(templateConfig.name, templateConfig.namespace);
  const vm = new VirtualMachine(vmConfig.name, vmConfig.namespace);
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
    await template.addDisk(hddDisk.name, hddDisk.size, hddDisk.storageClass);
    await vm.create(vmConfig);
    addLeakableResource(leakedResources, vm.asResource());
    const addedDisk = (await vm.getAttachedDisks()).find(disk => disk.name === hddDisk.name);
    expect(addedDisk).toEqual(hddDisk);

    deleteResource(vm.asResource());
    removeLeakableResource(leakedResources, vm.asResource());
  }, VM_ACTIONS_TIMEOUT);

  it('Add/remove nic to template', async() => {
    await template.addNic(networkInterface.name, networkInterface.mac, networkInterface.networkDefinition, networkInterface.binding);
    await vm.create(vmConfig);
    addLeakableResource(leakedResources, vm.asResource());
    const addedNic = (await vm.getAttachedNics()).find(nic => nic.name === networkInterface.name);
    expect(addedNic).toEqual(networkInterface);

    deleteResource(vm.asResource());
    removeLeakableResource(leakedResources, vm.asResource());
  }, VM_ACTIONS_TIMEOUT);

  it('Template values are displayed correctly', async() => {
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
