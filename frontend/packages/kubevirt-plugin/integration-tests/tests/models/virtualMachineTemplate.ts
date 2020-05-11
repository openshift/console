/* eslint-disable no-await-in-loop */
import { VMTemplateConfig, VirtualMachineTemplateModel, VMConfig } from '../utils/types';
import { ProvisionConfigName } from '../utils/constants/wizard';
import { Wizard } from './wizard';
import { KubevirtUIResource } from './kubevirtUIResource';
import { VirtualMachine } from './virtualMachine';
import {
  VMT_ACTION,
  VM_STATUS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
} from '../utils/consts';
import { detailViewAction, listViewAction } from '../../views/vm.actions.view';

const confirmedActions: VMT_ACTION[] = [VMT_ACTION.Delete];

export class VirtualMachineTemplate extends KubevirtUIResource {
  constructor(templateConfig) {
    super({ ...templateConfig, model: VirtualMachineTemplateModel });
  }

  async action(action: VMT_ACTION) {
    await this.navigateToDetail();
    await detailViewAction(action, confirmedActions.includes(action));
  }

  async listViewAction(action: VMT_ACTION) {
    await this.navigateToListView();
    await listViewAction(this.name)(action, confirmedActions.includes(action));
  }

  async create({
    name,
    description,
    provisionSource,
    operatingSystem,
    flavorConfig,
    workloadProfile,
    cloudInit,
    storageResources,
    networkResources,
  }: VMTemplateConfig) {
    await this.navigateToListView();

    // Basic Settings for VM template
    const wizard = new Wizard();
    await wizard.openWizard(this.model);

    await wizard.selectProvisionSource(provisionSource);
    await wizard.selectOperatingSystem(operatingSystem);
    await wizard.selectFlavor(flavorConfig);
    await wizard.selectWorkloadProfile(workloadProfile);
    await wizard.fillName(name);
    await wizard.fillDescription(description);

    await wizard.next();

    // Networking
    for (const resource of networkResources) {
      await wizard.addNIC(resource);
    }
    if (provisionSource.method === ProvisionConfigName.PXE) {
      // Select the last NIC as the source for booting
      await wizard.selectBootableNIC(networkResources[networkResources.length - 1].name);
    }
    await wizard.next();

    // Storage
    for (const resource of storageResources) {
      if (resource.name === 'rootdisk' && provisionSource.method === ProvisionConfigName.URL) {
        await wizard.editDisk(resource.name, resource);
      } else {
        await wizard.addDisk(resource);
      }
    }

    if (provisionSource.method === ProvisionConfigName.DISK) {
      // Select the last Disk as the source for booting
      if (storageResources.length > 0) {
        await wizard.selectBootableDisk(storageResources[storageResources.length - 1].name);
      } else {
        throw Error(`Provision source ${ProvisionConfigName.DISK} is missing a storage.`);
      }
    }

    await wizard.next();

    // Advanced - Cloud Init
    if (cloudInit?.useCloudInit) {
      await wizard.configureCloudInit(cloudInit);
    }
    await wizard.next();
    // Advanced - Virtual Hardware
    await wizard.next();

    // Create VM template
    await wizard.confirmAndCreate();
    await wizard.waitForCreation();

    // Verify VM template is created
    await this.navigateToDetail();
  }

  async createVM({
    name,
    description,
    startOnCreation,
    cloudInit,
    storageResources,
    CDRoms,
    networkResources,
  }: VMConfig): Promise<VirtualMachine> {
    const wizard = new Wizard();
    await this.navigateToListView();
    await this.action(VMT_ACTION.Create);

    await wizard.fillName(name);
    await wizard.fillDescription(description);
    await wizard.next();

    // Networking
    for (const resource of networkResources) {
      await wizard.addNIC(resource);
    }
    await wizard.next();

    // Storage
    for (const resource of storageResources) {
      await wizard.addDisk(resource);
    }
    await wizard.next();

    // Advanced - Cloud Init
    if (cloudInit?.useCloudInit) {
      await wizard.configureCloudInit(cloudInit);
    }
    await wizard.next();

    // Advanced - Virtual Hardware
    if (CDRoms) {
      for (const resource of CDRoms) {
        await wizard.addCD(resource);
      }
    }
    await wizard.next();

    // Review page
    if (startOnCreation) {
      await wizard.startOnCreation();
    }
    await wizard.confirmAndCreate();
    await wizard.waitForCreation();

    const vm: VirtualMachine = new VirtualMachine({ name, namespace: this.namespace });
    await vm.navigateToDetail();
    if (startOnCreation) {
      // If startOnCreation is true, wait for VM to boot up
      await vm.waitForStatus(VM_STATUS.Running, VM_BOOTUP_TIMEOUT_SECS);
    } else {
      // Else wait for possible import to finish
      await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
    }
    return vm;
  }
}
