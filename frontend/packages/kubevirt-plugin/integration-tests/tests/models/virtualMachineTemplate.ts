/* eslint-disable no-await-in-loop */
import {
  filterForName,
  resourceRowsPresent,
} from '@console/internal-integration-tests/views/crud.view';
import { VMTemplateConfig, VirtualMachineTemplateModel } from '../utils/types';
import { ProvisionConfigName } from '../utils/constants/wizard';
import { Wizard } from './wizard';
import { KubevirtUIResource } from './kubevirtUIResource';

export class VirtualMachineTemplate extends KubevirtUIResource {
  constructor(templateConfig) {
    super({ ...templateConfig, kind: VirtualMachineTemplateModel });
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
    await wizard.openWizard(this.kind);

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
    if (cloudInit.useCloudInit) {
      await wizard.configureCloudInit(cloudInit);
    }
    await wizard.next();
    // Advanced - Virtual Hardware
    await wizard.next();

    // Create VM template
    await wizard.confirmAndCreate();
    await wizard.waitForCreation();

    // Verify VM template is created
    await this.navigateToListView();
    await filterForName(name);
    await resourceRowsPresent();
  }

  asResource() {
    return {
      kind: 'template',
      metadata: {
        namespace: this.namespace,
        name: this.name,
      },
    };
  }
}
