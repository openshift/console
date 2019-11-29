import { browser, ExpectedConditions as until } from 'protractor';
import { createItemButton } from '@console/internal-integration-tests/views/crud.view';
import { click, asyncForEach } from '@console/shared/src/test-utils/utils';
import { fillInput, selectOptionByText } from '../utils/utils';
import { CloudInitConfig, StorageResource, NetworkResource } from '../utils/types';
import { WIZARD_CREATE_VM_SUCCESS, PAGE_LOAD_TIMEOUT_SECS } from '../utils/consts';
import * as wizardView from '../../views/wizard.view';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';

export class Wizard {
  async openWizard() {
    await click(createItemButton);
    await click(wizardView.createWithWizardLink);
    await wizardView.waitForNoLoaders();
  }

  async next() {
    await click(wizardView.nextButton);
    await wizardView.waitForNoLoaders();
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

  async selectFlavor(flavor: string) {
    await selectOptionByText(wizardView.flavorSelect, flavor);
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

  /**
   * Edits attributes of a disk. Returns new StorageResource with updated attributes.
   * @param   {string}              name     Name of a disk to edit.
   * @param   {StorageResource}     disk     Disk with the requested attributes.
   */
  async editDisk(name: string, disk: StorageResource) {
    await wizardView.clickKebabAction(name, 'Edit');
    const addDiskDialog = new DiskDialog();
    await addDiskDialog.edit(disk);
  }

  async confirmAndCreate() {
    await click(wizardView.createVirtualMachineButton);
  }

  async waitForCreation() {
    await browser.wait(
      until.textToBePresentInElement(wizardView.creationStatus, WIZARD_CREATE_VM_SUCCESS),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }
}
