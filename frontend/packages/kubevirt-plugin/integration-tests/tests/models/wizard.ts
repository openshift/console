import { browser, ExpectedConditions as until } from 'protractor';
import {
  createItemButton,
  resourceTitle,
  isLoaded,
} from '@console/internal-integration-tests/views/crud.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { click, fillInput, asyncForEach } from '@console/shared/src/test-utils/utils';
import { selectOptionByText } from '../utils/utils';
import { CloudInitConfig, StorageResource, NetworkResource, FlavorConfig } from '../utils/types';
import { WIZARD_CREATE_VM_SUCCESS, PAGE_LOAD_TIMEOUT_SECS, KEBAP_ACTION } from '../utils/consts';
import * as wizardView from '../../views/wizard.view';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { Flavor } from '../utils/constants/wizard';

export class Wizard {
  async openWizard(kind: string) {
    if (!(await resourceTitle.isPresent()) || (await resourceTitle.getText()) !== kind) {
      await clickNavLink(['Workloads', kind]);
      await isLoaded();
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

  async confirmAndCreate() {
    await click(wizardView.createVirtualMachineButton);
  }

  async waitForCreation() {
    await browser.wait(
      until.textToBePresentInElement(wizardView.creationSuccessResult, WIZARD_CREATE_VM_SUCCESS),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }
}
