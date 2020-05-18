/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createItemButton, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import {
  click,
  fillInput,
  asyncForEach,
  waitForStringInElement,
  waitForStringNotInElement,
} from '@console/shared/src/test-utils/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { selectOptionByText, enabledAsBoolean } from '../utils/utils';
import {
  CloudInitConfig,
  StorageResource,
  NetworkResource,
  FlavorConfig,
  VirtualMachineTemplateModel,
  KubevirtResourceConfig,
} from '../utils/types';
import {
  WIZARD_CREATE_SUCCESS,
  PAGE_LOAD_TIMEOUT_SECS,
  KEBAP_ACTION,
  VIRTUALIZATION_TITLE,
  SEC,
  VM_STATUS,
  VM_BOOTUP_TIMEOUT_SECS,
} from '../utils/consts';
import * as wizardView from '../../views/wizard.view';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { Flavor, ProvisionConfigName } from '../utils/constants/wizard';
import { resourceHorizontalTab } from '../../views/uiResource.view';
import { virtualizationTitle } from '../../views/vms.list.view';
import { VirtualMachine } from './virtualMachine';
import { vmDetailStatus } from '../../views/virtualMachine.view';
import { VirtualMachineTemplate } from './virtualMachineTemplate';

export class Wizard {
  async openWizard(model: K8sKind) {
    if (
      !(await virtualizationTitle.isPresent()) ||
      (await virtualizationTitle.getText()) !== VIRTUALIZATION_TITLE
    ) {
      await clickNavLink(['Workloads', 'Virtualization']);
      await isLoaded();
      if (model === VirtualMachineTemplateModel) {
        await click(resourceHorizontalTab(VirtualMachineTemplateModel));
        await isLoaded();
      }
    }
    await click(createItemButton);
    await click(wizardView.createWithWizardButton);
    await wizardView.waitForNoLoaders();
  }

  async closeWizard() {
    await click(wizardView.cancelButton);
    await browser
      .switchTo()
      .alert()
      .accept();
  }

  async next() {
    await click(wizardView.nextButton);
    try {
      await browser.wait(until.presenceOf(wizardView.footerError), 1 * SEC);
    } catch (e) {
      // footerError wasn't displayed, everything is OK
      return;
    }
    // An error is displayed
    throw new Error(await wizardView.footerErrorDescroption.getText());
  }

  async fillName(name: string) {
    await fillInput(wizardView.nameInput, name);
  }

  async fillDescription(description: string) {
    await fillInput(wizardView.descriptionInput, description);
  }

  async selectTemplate(template: string) {
    await selectOptionByText(wizardView.templateSelect, template);
  }

  async selectOperatingSystem(operatingSystem: string) {
    await selectOptionByText(wizardView.operatingSystemSelect, operatingSystem);
  }

  async selectFlavor(flavor: FlavorConfig) {
    await selectOptionByText(wizardView.flavorSelect, flavor.flavor);
    if (flavor.flavor === Flavor.CUSTOM && (!flavor.memory || !flavor.cpu)) {
      throw Error('Custom Flavor requires memory and cpu values.');
    }
    if (flavor.memory) {
      await fillInput(wizardView.customFlavorMemoryInput, flavor.memory);
    }
    if (flavor.cpu) {
      await fillInput(wizardView.customFlavorCpusInput, flavor.cpu);
    }
  }

  async selectWorkloadProfile(workloadProfile: string) {
    await selectOptionByText(wizardView.workloadProfileSelect, workloadProfile);
  }

  async selectProvisionSource(provisionOptions) {
    await selectOptionByText(wizardView.provisionSourceSelect, provisionOptions.method);
    if (Object.prototype.hasOwnProperty.call(provisionOptions, 'source')) {
      await fillInput(
        wizardView.provisionSources[provisionOptions.method],
        provisionOptions.source,
      );
    }
  }

  async startOnCreation() {
    await click(wizardView.startVMOnCreation);
  }

  async configureCloudInit(cloudInitOptions: CloudInitConfig) {
    if (cloudInitOptions.useCustomScript) {
      await click(wizardView.cloudInitCustomScriptCheckbox);
      await fillInput(wizardView.customCloudInitScriptTextArea, cloudInitOptions.customScript);
    } else {
      await fillInput(wizardView.cloudInitHostname, cloudInitOptions.hostname || '');
      await asyncForEach(cloudInitOptions.sshKeys, async (sshKey: string, index: number) => {
        await fillInput(wizardView.cloudInitSSHKey(index + 1), sshKey);
        await click(wizardView.cloudInitAddKeyButton);
      });
    }
  }

  async addNIC(nic: NetworkResource) {
    await click(wizardView.addNICButton);
    const addNICDialog = new NetworkInterfaceDialog();
    await addNICDialog.create(nic);
  }

  /**
   * Edits attributes of a NIC.
   * @param   {string}              name     Name of a NIC to edit.
   * @param   {NetworkResource}     NIC      NIC with the requested attributes.
   */
  async editNIC(name: string, NIC: NetworkResource) {
    await wizardView.clickKebabAction(name, KEBAP_ACTION.Edit);
    const addNICDialog = new NetworkInterfaceDialog();
    await addNICDialog.edit(NIC);
  }

  async selectBootableNIC(networkDefinition: string) {
    await selectOptionByText(wizardView.pxeBootSourceSelect, networkDefinition);
  }

  async selectBootableDisk(diskName: string) {
    await selectOptionByText(wizardView.storageBootSourceSelect, diskName);
  }

  async addDisk(disk: StorageResource) {
    await click(wizardView.addDiskButton);
    const addDiskDialog = new DiskDialog();
    await addDiskDialog.create(disk);
  }

  async addCD(cd: StorageResource) {
    await click(wizardView.addCDButton);
    const addDiskDialog = new DiskDialog();
    await addDiskDialog.create(cd);
  }

  /**
   * Edits attributes of a disk.
   * @param   {string}              name     Name of a disk to edit.
   * @param   {StorageResource}     disk     Disk with the requested attributes.
   */
  async editDisk(name: string, disk: StorageResource) {
    await wizardView.clickKebabAction(name, KEBAP_ACTION.Edit);
    const addDiskDialog = new DiskDialog();
    await addDiskDialog.edit(disk);
  }

  async validateReviewTab(config) {
    expect(await wizardView.nameReviewValue.getText()).toEqual(config.name);
    if (config.description) {
      expect(await wizardView.descriptionReviewValue.getText()).toEqual(config.description);
    }
    if (config.operatingSystem) {
      expect(await wizardView.osReviewValue.getText()).toEqual(config.operatingSystem);
    }
    if (config.flavorConfig) {
      expect(await wizardView.flavorReviewValue.getText()).toContain(config.flavorConfig.flavor);
    }
    if (config.workloadProfile) {
      expect(await wizardView.workloadProfileReviewValue.getText()).toEqual(config.workloadProfile);
    }
    if (config.cloudInit?.useCloudInit) {
      expect(enabledAsBoolean(await wizardView.cloudInitReviewValue.getText())).toEqual(
        config.cloudInit.useCloudInit,
      );
    }
  }

  async confirmAndCreate() {
    await click(wizardView.createVirtualMachineButton);
  }

  async waitForCreation() {
    await browser.wait(
      until.textToBePresentInElement(wizardView.creationSuccessResult, WIZARD_CREATE_SUCCESS),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }

  async processWizard(config: KubevirtResourceConfig) {
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
    await this.fillName(name);
    if (description) {
      await this.fillDescription(description);
    }
    if (template) {
      await this.selectTemplate(template);
    } else {
      if (provisionSource) {
        await this.selectProvisionSource(provisionSource);
      }
      if (operatingSystem) {
        await this.selectOperatingSystem(operatingSystem);
      }
      if (workloadProfile) {
        await this.selectWorkloadProfile(workloadProfile);
      }
    }
    await this.selectFlavor(flavorConfig);
    await this.next();

    // Networking
    for (const resource of networkResources) {
      await this.addNIC(resource);
    }
    if (provisionSource?.method === ProvisionConfigName.PXE && template === undefined) {
      // Select the last NIC as the source for booting
      await this.selectBootableNIC(networkResources[networkResources.length - 1].name);
    }
    await this.next();

    // Storage
    for (const resource of storageResources) {
      if (resource.name === 'rootdisk' && provisionSource.method === ProvisionConfigName.URL) {
        await this.editDisk(resource.name, resource);
      } else {
        await this.addDisk(resource);
      }
    }
    if (provisionSource?.method === ProvisionConfigName.DISK) {
      if (bootableDevice) {
        await this.selectBootableDisk(bootableDevice);
      } else if (storageResources.length > 0) {
        // Select the last Disk as the source for booting
        await this.selectBootableDisk(storageResources[storageResources.length - 1].name);
      } else {
        throw Error(`No bootable device provided for ${provisionSource.method} provision method.`);
      }
    }
    await this.next();

    // Advanced - Cloud Init
    if (cloudInit?.useCloudInit) {
      if (template !== undefined) {
        // TODO: wizard.useCloudInit needs to check state of checkboxes before clicking them to ensure desired state is achieved with specified template
        throw new Error('Using cloud init with template not yet implemented.');
      }
      await this.configureCloudInit(cloudInit);
    }
    await this.next();

    // Advanced - Virtual Hardware
    if (CDRoms) {
      for (const resource of CDRoms) {
        await this.addCD(resource);
      }
    }
    await this.next();

    // Review page
    if (startOnCreation) {
      await this.startOnCreation();
    }
    await this.validateReviewTab(config);

    // Create
    await this.confirmAndCreate();
    await this.waitForCreation();

    // TODO check for error and in case of error throw Error
  }

  async createVirtualMachine(config: KubevirtResourceConfig): Promise<VirtualMachine> {
    await this.openWizard(VirtualMachineModel);
    await this.processWizard(config);

    const vm = new VirtualMachine({ name: config.name, namespace: testName });
    await vm.navigateToDetail();

    if (config.waitForDiskImport) {
      await browser.wait(
        waitForStringNotInElement(vmDetailStatus(vm.namespace, vm.name), VM_STATUS.Importing),
        VM_BOOTUP_TIMEOUT_SECS,
      );
    }
    if (config.startOnCreation) {
      await browser.wait(
        waitForStringInElement(vmDetailStatus(vm.namespace, vm.name), VM_STATUS.Running),
        VM_BOOTUP_TIMEOUT_SECS,
      );
    }
    return vm;
  }

  async createVirtualMachineTemplate(
    config: KubevirtResourceConfig,
  ): Promise<VirtualMachineTemplate> {
    await this.openWizard(VirtualMachineTemplateModel);
    await this.processWizard(config);

    const vmt = new VirtualMachineTemplate({ name: config.name, namespace: testName });
    await vmt.navigateToDetail();
    return vmt;
  }
}
