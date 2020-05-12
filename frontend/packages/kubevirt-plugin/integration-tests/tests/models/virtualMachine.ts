/* eslint-disable no-await-in-loop, no-console */
import { browser } from 'protractor';
import { waitForStringNotInElement } from '@console/shared/src/test-utils/utils';
import * as vmView from '../../views/virtualMachine.view';
import { VMConfig, VMImportConfig } from '../utils/types';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
  VM_ACTION,
  TAB,
  VM_IMPORT_TIMEOUT_SECS,
  VM_STATUS,
} from '../utils/consts';
import { detailViewAction, listViewAction } from '../../views/vm.actions.view';
import { ProvisionConfigName } from '../utils/constants/wizard';
import { Wizard } from './wizard';
import { ImportWizard } from './importWizard';
import { VirtualMachineModel } from '../../../src/models/index';
import { BaseVirtualMachine } from './baseVirtualMachine';
import * as wizardView from '../../views/wizard.view';
import { enabledAsBoolean } from '../utils/utils';

// TODO: Remove VM_ACTION.Delete action from the list when BZ 1827640 is resolved
const noConfirmDialogActions: VM_ACTION[] = [VM_ACTION.Start, VM_ACTION.Clone, VM_ACTION.Delete];

export class VirtualMachine extends BaseVirtualMachine {
  constructor(config) {
    super({ ...config, model: VirtualMachineModel });
  }

  async action(action: VM_ACTION, waitForAction = true, timeout?: number) {
    await this.navigateToTab(TAB.Details);

    await detailViewAction(action, !noConfirmDialogActions.includes(action));
    if (waitForAction) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async listViewAction(action: VM_ACTION, waitForAction = true, timeout?: number) {
    await this.navigateToListView();

    await listViewAction(this.name)(action, !noConfirmDialogActions.includes(action));
    if (waitForAction) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async waitForMigrationComplete(fromNode: string, timeout: number) {
    await this.waitForStatus(VM_STATUS.Running, VM_MIGRATION_TIMEOUT_SECS);
    await browser.wait(
      waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), fromNode),
      timeout,
    );
  }

  async validateReviewTab(config, isCreate: boolean = false) {
    expect(await wizardView.nameReviewValue.getText()).toEqual(config.name);
    expect(await wizardView.descriptionReviewValue.getText()).toEqual(config.description);
    expect(await wizardView.osReviewValue.getText()).toEqual(config.operatingSystem);
    expect(await wizardView.flavorReviewValue.getText()).toEqual(config.flavorConfig.flavor);
    expect(await wizardView.workloadProfileReviewValue.getText()).toEqual(config.workloadProfile);
    expect(enabledAsBoolean(await wizardView.cloudInitReviewValue.getText())).toEqual(
      config.cloudInit.useCloudInit,
    );

    if (isCreate) {
      expect(await wizardView.provisionSourceTypeReviewValue.getText()).toEqual(
        config.provisionSource?.source,
      );
    }
  }

  async create(config: VMConfig) {
    const {
      name,
      description,
      template,
      provisionSource,
      operatingSystem,
      flavorConfig,
      workloadProfile,
      startOnCreation,
      cloudInit,
      storageResources,
      CDRoms,
      networkResources,
      bootableDevice,
    } = config;
    const wizard = new Wizard();
    await this.navigateToListView();
    await wizard.openWizard(this.model);
    if (template !== undefined) {
      await wizard.selectTemplate(template);
    } else {
      await wizard.selectProvisionSource(provisionSource);
      await wizard.selectOperatingSystem(operatingSystem);
      await wizard.selectWorkloadProfile(workloadProfile);
    }
    await wizard.selectFlavor(flavorConfig);
    await wizard.fillName(name);
    await wizard.fillDescription(description);
    await wizard.next();

    // Networking
    for (const resource of networkResources) {
      await wizard.addNIC(resource);
    }
    if (provisionSource.method === ProvisionConfigName.PXE && template === undefined) {
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
      if (bootableDevice !== undefined) {
        await wizard.selectBootableDisk(bootableDevice);
      } else if (storageResources.length > 0) {
        // Select the last Disk as the source for booting
        await wizard.selectBootableDisk(storageResources[storageResources.length - 1].name);
      } else {
        throw Error(`No bootable device provided for ${provisionSource.method} provision method.`);
      }
    }
    await wizard.next();

    // Advanced - Cloud Init
    if (cloudInit.useCloudInit) {
      if (template !== undefined) {
        // TODO: wizard.useCloudInit needs to check state of checkboxes before clicking them to ensure desired state is achieved with specified template
        throw new Error('Using cloud init with template not implemented.');
      }
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
    await this.validateReviewTab(config, true);

    // Create
    await wizard.confirmAndCreate();
    await wizard.waitForCreation();

    // Navigate to detail and check results
    await this.navigateToTab(TAB.Details);
    if (startOnCreation) {
      // If startOnCreation is true, wait for VM to boot up
      await this.waitForStatus(VM_STATUS.Running, VM_BOOTUP_TIMEOUT_SECS);
    } else {
      // Else wait for possible import to finish
      await this.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
    }
  }

  async import(config: VMImportConfig) {
    const {
      provider,
      instanceConfig,
      sourceVMName,
      name,
      description,
      operatingSystem,
      flavorConfig,
      workloadProfile,
      storageResources,
      networkResources,
      cloudInit,
    } = config;
    const importWizard = new ImportWizard();
    await this.navigateToListView();
    await importWizard.openWizard();

    // General section
    await importWizard.selectProvider(provider);
    await importWizard.waitForVMWarePod();
    await importWizard.configureInstance(instanceConfig);

    await importWizard.connectToInstance();
    await importWizard.waitForInstanceSync();

    await importWizard.selectSourceVirtualMachine(sourceVMName);
    await importWizard.waitForInstanceSync();

    if (operatingSystem) {
      await importWizard.selectOperatingSystem(operatingSystem as string);
    }
    if (flavorConfig) {
      await importWizard.selectFlavor(flavorConfig);
    }
    if (workloadProfile) {
      await importWizard.selectWorkloadProfile(workloadProfile);
    }
    if (name) {
      await importWizard.fillName(name);
    }
    if (description) {
      await importWizard.fillDescription(description);
    }
    await importWizard.next();

    // Networking
    // First update imported network interfaces to comply with k8s
    await importWizard.updateImportedNICs();
    // Optionally add new interfaces, if any
    if (networkResources !== undefined) {
      for (const NIC of networkResources) {
        await importWizard.addNIC(NIC);
      }
    }
    await importWizard.next();

    // Storage
    // First update disks that come from the source VM
    await importWizard.updateImportedDisks();
    // Optionally add new disks
    if (networkResources !== undefined) {
      for (const disk of storageResources) {
        await importWizard.addDisk(disk);
      }
    }
    await importWizard.next();

    // Advanced - Cloud Init
    if (cloudInit !== undefined) {
      await importWizard.configureCloudInit(cloudInit);
    }
    await importWizard.next();

    // Advanced - Virtual HW
    await importWizard.next();

    // Review
    await this.validateReviewTab(config);

    // Import
    await importWizard.confirmAndCreate();
    await importWizard.waitForCreation();

    // Navigate to detail page
    await importWizard.navigateToDetail();
  }
}
