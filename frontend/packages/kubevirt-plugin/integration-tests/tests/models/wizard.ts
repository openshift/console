/* eslint-disable no-await-in-loop */
import * as _ from 'lodash';
import { browser, ExpectedConditions as until } from 'protractor';
import { createItemButton, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { click, fillInput, asyncForEach } from '@console/shared/src/test-utils/utils';
import { K8sKind } from '@console/internal/module/k8s';
import {
  selectOptionByText,
  enabledAsBoolean,
  selectItemFromDropdown,
  getResourceUID,
} from '../utils/utils';
import {
  CloudInitConfig,
  Disk,
  Network,
  FlavorConfig,
  VirtualMachineTemplateModel,
} from '../types/types';
import {
  WIZARD_CREATE_SUCCESS,
  PAGE_LOAD_TIMEOUT_SECS,
  KEBAP_ACTION,
  VIRTUALIZATION_TITLE,
  SEC,
} from '../utils/constants/common';
import * as view from '../../views/wizard.view';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { Flavor } from '../utils/constants/wizard';
import { resourceHorizontalTab } from '../../views/uiResource.view';
import { virtualizationTitle } from '../../views/vms.list.view';
import { VMBuilderData } from '../types/vm';
import { ProvisionSource } from '../utils/constants/enums/provisionSource';
import { TemplateModel } from '@console/internal/models';
import { templateCreateVMLink } from '../../views/template.view';

export class Wizard {
  async openWizard(model: K8sKind) {
    if (
      !(await virtualizationTitle.isPresent()) ||
      (await virtualizationTitle.getText()) !== VIRTUALIZATION_TITLE
    ) {
      await clickNavLink(['Workloads', 'Virtualization']);
      await isLoaded();
    }
    if (model === VirtualMachineTemplateModel) {
      await click(resourceHorizontalTab(VirtualMachineTemplateModel));
      await isLoaded();
    }

    await click(createItemButton);
    await click(view.createWithWizardButton);
    await view.waitForNoLoaders();
  }

  async openVMFromTemplateWizard(template: string, namespace: string) {
    await click(resourceHorizontalTab(VirtualMachineTemplateModel));
    await isLoaded();
    const uid = getResourceUID(TemplateModel.kind, template, namespace);
    await click(templateCreateVMLink(uid));
  }

  async closeWizard() {
    await click(view.cancelButton);
    await browser
      .switchTo()
      .alert()
      .accept();
  }

  async next(ignoreWarnings: boolean = false) {
    await click(view.nextButton);
    if (!ignoreWarnings) {
      try {
        await browser.wait(until.presenceOf(view.footerError), 1 * SEC);
      } catch (e) {
        // footerError wasn't displayed, everything is OK
        return;
      }
      // An error is displayed
      throw new Error(await view.footerErrorDescroption.getText());
    }
  }

  async fillName(name: string) {
    await fillInput(view.nameInput, name);
  }

  async fillDescription(description: string) {
    await fillInput(view.descriptionInput, description);
  }

  async selectTemplate(template: string) {
    await selectOptionByText(view.templateSelect, template);
  }

  async selectOperatingSystem(operatingSystem: string) {
    await selectItemFromDropdown(view.operatingSystemSelect, view.dropDownItem(operatingSystem));
  }

  async selectFlavor(flavor: FlavorConfig) {
    await selectItemFromDropdown(view.flavorSelect, view.dropDownItem(flavor.flavor));
    if (flavor.flavor === Flavor.CUSTOM && (!flavor.memory || !flavor.cpu)) {
      throw Error('Custom Flavor requires memory and cpu values.');
    }
    if (flavor.memory) {
      await fillInput(view.customFlavorMemoryInput, flavor.memory);
    }
    if (flavor.cpu) {
      await fillInput(view.customFlavorCpusInput, flavor.cpu);
    }
  }

  async selectWorkloadProfile(workloadProfile: string) {
    await selectItemFromDropdown(view.workloadProfileSelect, view.dropDownItem(workloadProfile));
  }

  async disableGoldenImageCloneCheckbox() {
    if (
      (await view.goldenImageCloneCheckbox.isPresent()) &&
      (await view.goldenImageCloneCheckbox.isSelected())
    ) {
      await click(view.goldenImageCloneCheckbox);
    }
  }

  async selectProvisionSource(provisionSource: ProvisionSource) {
    await selectItemFromDropdown(
      view.provisionSourceSelect,
      view.dropDownItemTitle(provisionSource.getDescription()),
    );
    if (provisionSource.getSource()) {
      await fillInput(
        view.provisionSourceInputs[provisionSource.getValue()],
        provisionSource.getSource(),
      );
    }
  }

  async startOnCreation() {
    await click(view.startVMOnCreation);
  }

  async configureCloudInit(cloudInitOptions: CloudInitConfig) {
    if (cloudInitOptions.useCustomScript) {
      await click(view.cloudInitCustomScriptCheckbox);
      await fillInput(view.customCloudInitScriptTextArea, cloudInitOptions.customScript);
    } else {
      await fillInput(view.cloudInitHostname, cloudInitOptions.hostname || '');
      await asyncForEach(cloudInitOptions.sshKeys, async (sshKey: string, index: number) => {
        await fillInput(view.cloudInitSSHKey(index + 1), sshKey);
        await click(view.cloudInitAddKeyButton);
      });
    }
  }

  async addNIC(nic: Network) {
    await click(view.addNICButton);
    const addNICDialog = new NetworkInterfaceDialog();
    await addNICDialog.create(nic);
  }

  /**
   * Edits attributes of a NIC.
   * @param   {string}              name     Name of a NIC to edit.
   * @param   {Network}     NIC      NIC with the requested attributes.
   */
  async editNIC(name: string, NIC: Network) {
    await view.clickKebabAction(name, KEBAP_ACTION.Edit);
    const addNICDialog = new NetworkInterfaceDialog();
    await addNICDialog.edit(NIC);
  }

  async selectBootableNIC(networkDefinition: string) {
    await selectOptionByText(view.pxeBootSourceSelect, networkDefinition);
  }

  async selectBootableDisk(diskName: string) {
    await selectOptionByText(view.storageBootSourceSelect, diskName);
  }

  async addDisk(disk: Disk) {
    await click(view.addDiskButton);
    const addDiskDialog = new DiskDialog();
    await addDiskDialog.create(disk);
  }

  /**
   * Edits attributes of a disk.
   * @param   {string}              name     Name of a disk to edit.
   * @param   {Disk}     disk     Disk with the requested attributes.
   */
  async editDisk(name: string, disk: Disk) {
    await view.clickKebabAction(name, KEBAP_ACTION.Edit);
    const addDiskDialog = new DiskDialog();
    await addDiskDialog.edit(disk);
  }

  async validateReviewTab(data) {
    expect(await view.nameReviewValue.getText()).toEqual(data.name);
    if (data.description) {
      expect(await view.descriptionReviewValue.getText()).toEqual(data.description);
    }
    if (data.operatingSystem) {
      expect(await view.osReviewValue.getText()).toEqual(data.operatingSystem);
    }
    if (data.flavorConfig) {
      expect(await view.flavorReviewValue.getText()).toContain(data.flavorConfig.flavor);
    }
    if (data.workloadProfile) {
      expect(await view.workloadProfileReviewValue.getText()).toEqual(data.workloadProfile);
    }
    if (data.cloudInit?.useCloudInit) {
      expect(enabledAsBoolean(await view.cloudInitReviewValue.getText())).toEqual(
        data.cloudInit.useCloudInit,
      );
    }
  }

  async confirmAndCreate() {
    await click(view.createVirtualMachineButton);
  }

  async waitForCreation() {
    await browser.wait(
      until.textToBePresentInElement(view.creationSuccessResult, WIZARD_CREATE_SUCCESS),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }

  async processGeneralStep(data: VMBuilderData) {
    const { name, description, template, provisionSource, os, flavor, workload } = data;
    if (name) {
      await this.fillName(name);
    } else {
      throw Error('VM Name not defined');
    }
    if (description) {
      await this.fillDescription(description);
    }
    if ((await browser.getCurrentUrl()).match(/\?template=.+$/)) {
      // We are creating a VM from template via its action button
      // ProvisionSource, OS and workload are prefilled and disabled - ignoring them
    } else if (template) {
      await this.selectTemplate(template);
    } else {
      if (os) {
        await this.selectOperatingSystem(os);
      } else {
        throw Error('VM OS not defined');
      }

      if (provisionSource && !_.isEqual(provisionSource, ProvisionSource.DISK)) {
        await this.disableGoldenImageCloneCheckbox();
        await this.selectProvisionSource(provisionSource);
      } else if (!_.isEqual(provisionSource, ProvisionSource.DISK)) {
        throw Error('VM Provision source not defined');
      }
      if (workload) {
        await this.selectWorkloadProfile(workload);
      } else {
        throw Error('VM Workload not defined');
      }
    }

    if (flavor) {
      await this.selectFlavor(flavor);
    } else {
      throw Error('VM Flavor not defined');
    }
    await this.next();
  }

  async processNetworkStep(data: VMBuilderData) {
    const { networks, provisionSource, template } = data;
    for (const resource of networks) {
      await this.addNIC(resource);
    }
    if (_.isEqual(provisionSource, ProvisionSource.PXE) && template === undefined) {
      // Select the last NIC as the source for booting
      await this.selectBootableNIC(networks[networks.length - 1].name);
    }
    await this.next();
  }

  async processStorageStep(data: VMBuilderData) {
    const { disks, provisionSource } = data;
    for (const disk of disks) {
      if (await view.tableRow(disk.name).isPresent()) {
        await this.editDisk(disk.name, disk);
      } else {
        await this.addDisk(disk);
      }

      if (provisionSource?.getValue() === ProvisionSource.DISK.getValue() && disk.bootable) {
        await this.selectBootableDisk(disk.name);
      }
    }
    await this.next();
  }

  async processAdvanceStep(data: VMBuilderData) {
    const { cloudInit, template } = data;
    if (cloudInit) {
      if (template !== undefined) {
        // TODO: wizard.useCloudInit needs to check state of checkboxes before clicking them to ensure desired state is achieved with specified template
        throw new Error('Using cloud init with template not yet implemented.');
      }
      await this.configureCloudInit(cloudInit);
    }
    await this.next();
  }

  async processReviewStep(data: VMBuilderData) {
    const { startOnCreation } = data;
    if (startOnCreation) {
      await this.startOnCreation();
    }
    await this.validateReviewTab(data);
  }

  async processWizard(data: VMBuilderData) {
    await this.processGeneralStep(data);
    await this.processNetworkStep(data);
    await this.processStorageStep(data);
    await this.processAdvanceStep(data);
    await this.processReviewStep(data);

    // Create
    await this.confirmAndCreate();
    await this.waitForCreation();
    // TODO check for error and in case of error throw Error
  }
}
