import { click } from '@console/shared/src/test-utils/utils';
import { fillInput, selectOptionByText, getSelectedOptionText } from '../utils/utils';
import * as view from '../../views/dialogs/diskDialog.view';
import { applyButton, saveButton } from '../../views/kubevirtDetailView.view';
import { StorageResource, DiskSourceConfig } from '../utils/types';
import { DISK_SOURCE } from '../utils/consts';
import { waitForNoLoaders } from '../../views/wizard.view';

export class DiskDialog {
  sourceMethods = {
    [DISK_SOURCE.AttachClonedDisk]: DiskDialog.selectSourceAttachClonedDisk,
    [DISK_SOURCE.AttachDisk]: DiskDialog.selectSourceAttachDisk,
    [DISK_SOURCE.Container]: DiskDialog.selectSourceContainer,
    [DISK_SOURCE.Url]: DiskDialog.selectSourceURL,
  };

  static async selectSourceAttachDisk(sourceConfig: DiskSourceConfig) {
    await selectOptionByText(view.diskPVC, sourceConfig.PVCName);
  }

  static async selectSourceAttachClonedDisk(sourceConfig: DiskSourceConfig) {
    await selectOptionByText(view.diskNamespace, sourceConfig.PVCNamespace);
    await selectOptionByText(view.diskPVC, sourceConfig.PVCName);
  }

  static async selectSourceContainer(sourceConfig: DiskSourceConfig) {
    await selectOptionByText(view.diskContainer, sourceConfig.container);
  }

  static async selectSourceURL(sourceConfig) {
    await selectOptionByText(view.diskURL, sourceConfig.URL);
  }

  async fillName(name: string) {
    await fillInput(view.diskName, name);
  }

  async fillSize(size: string) {
    if (size !== undefined && (await view.diskSize.isPresent())) {
      await fillInput(view.diskSize, size);
    }
  }

  async selectInterface(diskInterface: string) {
    await selectOptionByText(view.diskInterface, diskInterface);
  }

  async selectStorageClass(storageClass: string) {
    if (await view.diskStorageClass.isPresent()) {
      await selectOptionByText(view.diskStorageClass, storageClass);
    }
  }

  async getDiskSource() {
    return getSelectedOptionText(view.diskSource);
  }

  async create(disk: StorageResource) {
    await waitForNoLoaders();
    await selectOptionByText(view.diskSource, disk.source || DISK_SOURCE.Blank);
    if (this.sourceMethods[disk.source] !== undefined) {
      await this.sourceMethods[disk.source](disk.sourceConfig);
    }
    await this.fillName(disk.name);
    await this.fillSize(disk.size);
    await this.selectInterface(disk.interface);
    await this.selectStorageClass(disk.storageClass);
    await click(applyButton);
    await waitForNoLoaders();
  }

  async edit(disk: StorageResource) {
    await this.fillName(disk.name);
    await this.selectInterface(disk.interface);
    await this.selectStorageClass(disk.storageClass);
    if (disk.size) {
      await this.fillSize(disk.size);
    }
    await click(saveButton);
    await waitForNoLoaders();
  }
}
