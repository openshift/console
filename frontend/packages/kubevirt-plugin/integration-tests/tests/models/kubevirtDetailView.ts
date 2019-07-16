/* eslint-disable no-await-in-loop */
import { selectDropdownOption, click } from '../../../../console-shared/src/test-utils/utils';
import { isLoaded, resourceRows } from '../../../../../integration-tests/views/crud.view';
import { TABS, diskTabCol, networkTabCol } from '../utils/consts';
import { StorageResource, NetworkResource } from '../utils/types';
import { fillInput } from '../utils/utils';
import * as kubevirtDetailView from '../../views/kubevirtDetailView.view';
import { confirmAction } from '../../views/vm.actions.view';
import { DetailView } from './detailView';

export class KubevirtDetailView extends DetailView {
  async getAttachedDisks(): Promise<StorageResource[]> {
    await this.navigateToTab(TABS.DISKS);
    const resources = [];
    for (const row of await resourceRows) {
      const cells = row.$$('div');
      resources.push({
        name: await cells.get(diskTabCol.name).getText(),
        size: (await cells.get(diskTabCol.size).getText()).match(/^\d*/)[0],
        storageClass: await cells.get(diskTabCol.storageClass).getText(),
      });
    }
    return resources;
  }

  async getAttachedNICs(): Promise<NetworkResource[]> {
    await this.navigateToTab(TABS.NICS);
    const resources = [];
    for (const row of await resourceRows) {
      const cells = row.$$('div');
      resources.push({
        name: await cells.get(networkTabCol.name).getText(),
        mac: await cells.get(networkTabCol.mac).getText(),
        networkDefinition: await cells.get(networkTabCol.networkDefinition).getText(),
        binding: await cells.get(networkTabCol.binding).getText(),
      });
    }
    return resources;
  }

  async addDisk(disk: StorageResource) {
    await this.navigateToTab(TABS.DISKS);
    await click(kubevirtDetailView.createDisk, 1000);
    await fillInput(kubevirtDetailView.diskName, disk.name);
    await fillInput(kubevirtDetailView.diskSize, disk.size);
    await selectDropdownOption(kubevirtDetailView.diskStorageClassDropdownId, disk.storageClass);
    await click(kubevirtDetailView.applyBtn);
    await isLoaded();
  }

  async removeDisk(name: string) {
    await this.navigateToTab(TABS.DISKS);
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
  }

  async addNIC(nic: NetworkResource) {
    await this.navigateToTab(TABS.NICS);
    await click(kubevirtDetailView.createNic, 1000);
    await fillInput(kubevirtDetailView.nicName, nic.name);
    await selectDropdownOption(kubevirtDetailView.networkTypeDropdownId, nic.networkDefinition);
    await selectDropdownOption(kubevirtDetailView.networkBindingId, nic.binding);
    await fillInput(kubevirtDetailView.macAddress, nic.mac);
    await click(kubevirtDetailView.applyBtn);
    await isLoaded();
  }

  async removeNIC(name: string) {
    await this.navigateToTab(TABS.NICS);
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
  }
}
