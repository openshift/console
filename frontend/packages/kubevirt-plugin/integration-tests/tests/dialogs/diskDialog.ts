import { $, browser, ExpectedConditions as until } from 'protractor';
import { click, fillInput } from '../../utils/shared-utils';
import * as view from '../../views/dialogs/diskDialog.view';
import { modalSubmitButton, saveButton } from '../../views/kubevirtUIResource.view';
import { errorHelper, modalCancelButton, waitForNoLoaders } from '../../views/wizard.view';
import { AccessMode, VolumeMode } from '../mocks/mocks';
import { Disk, DiskSourceConfig } from '../types/types';
import { STORAGE_CLASS } from '../utils/constants/common';
import { ProvisionSource } from '../utils/constants/enums/provisionSource';
import { DISK_SOURCE } from '../utils/constants/vm';
import {
  checkForError,
  getSelectedOptionText,
  getSelectOptions,
  selectItemFromDropdown,
  selectOptionByOptionValue,
  selectOptionByText,
} from '../utils/utils';

export class DiskDialog {
  sourceMethods = {
    [DISK_SOURCE.AttachClonedDisk]: DiskDialog.selectSourceAttachClonedDisk,
    [DISK_SOURCE.AttachDisk]: DiskDialog.selectSourceAttachDisk,
    [DISK_SOURCE.Container]: DiskDialog.fillContainer,
    [DISK_SOURCE.EphemeralContainer]: DiskDialog.fillContainer,
    [DISK_SOURCE.Url]: DiskDialog.fillURL,
  };

  static async selectSourceAttachDisk(sourceConfig: DiskSourceConfig) {
    await selectOptionByText(view.diskPVC, sourceConfig.PVCName);
  }

  static async selectSourceAttachClonedDisk(sourceConfig: DiskSourceConfig) {
    await selectOptionByText(view.diskNamespace, sourceConfig.PVCNamespace);
    await selectOptionByText(view.diskPVC, sourceConfig.PVCName);
  }

  static async fillContainer(sourceConfig: DiskSourceConfig) {
    if (sourceConfig === undefined) {
      await fillInput(view.diskContainer, ProvisionSource.CONTAINER.getSource());
    } else {
      await fillInput(view.diskContainer, sourceConfig.container);
    }
  }

  static async fillURL(sourceConfig: DiskSourceConfig) {
    if (sourceConfig === undefined) {
      await fillInput(view.diskContainer, ProvisionSource.URL.getSource());
    } else {
      await fillInput(view.diskContainer, sourceConfig.URL);
    }
  }

  async fillName(name: string) {
    await fillInput(view.diskName, name);
    return checkForError(errorHelper);
  }

  async fillSize(size: string) {
    if (size !== undefined && (await view.diskSize.isPresent())) {
      await fillInput(view.diskSize, size);
    }
  }

  async selectInterface(diskInterface: string) {
    await selectItemFromDropdown(view.diskInterface, view.diskDropDownItem(diskInterface));
  }

  async selectStorageClass(storageClass: string) {
    if (await view.diskStorageClass.isPresent()) {
      await selectOptionByText(view.diskStorageClass, storageClass);
    }
  }

  async openAdvancedSettingsDrawer() {
    if (await view.advancedDrawerToggle.isPresent()) {
      if ((await view.advancedDrawerToggle.getAttribute('aria-expanded')) === 'false') {
        // Only click the Advanced button if it isn't already expanded
        await click(view.advancedDrawerToggle);
      }
    }
  }

  async selectVolumeMode(volumeMode: string) {
    await selectOptionByText(view.diskVolumeMode, volumeMode);
  }

  async selectAccessMode(accessMode: string) {
    await selectOptionByOptionValue(view.diskAccessMode, accessMode);
  }

  async selectStorageOptions() {
    await this.selectStorageClass(STORAGE_CLASS);
    await this.openAdvancedSettingsDrawer();
    if (!(await view.diskVolumeHelpText.isPresent())) {
      await this.selectVolumeMode(VolumeMode);
    }
    await this.selectAccessMode(AccessMode);
  }

  async getDiskSource() {
    return getSelectedOptionText(view.diskSource);
  }

  async getInterfaceOptions() {
    return getSelectOptions(view.diskInterface);
  }

  async create(disk: Disk) {
    await waitForNoLoaders();

    await selectItemFromDropdown(
      view.diskSource,
      view.diskDropDownItem(disk.source || DISK_SOURCE.Blank),
    );

    if (this.sourceMethods[disk.source] !== undefined) {
      await this.sourceMethods[disk.source](disk.sourceConfig);
    }
    if (disk.name) {
      await this.fillName(disk.name);
    }
    if (disk.size) {
      await this.fillSize(disk.size);
    }
    if (disk.interface) {
      await this.selectInterface(disk.interface);
    }

    if (await view.diskStorageClass.isPresent()) {
      await this.selectStorageOptions();
    }

    await click(modalSubmitButton);
    await waitForNoLoaders();
  }

  async edit(disk: Disk) {
    if (disk.name) {
      await this.fillName(disk.name);
    }
    if (disk.size) {
      await this.fillSize(disk.size);
    }
    if (disk.interface) {
      await this.selectInterface(disk.interface);
    }

    if (await view.diskStorageClass.isPresent()) {
      await this.selectStorageOptions();
    }

    await click(saveButton);
    await waitForNoLoaders();
  }

  async close() {
    await click(modalCancelButton);
    await browser.wait(until.not(until.presenceOf($('.co-overlay'))));
  }
}
