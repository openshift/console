// eslint-disable-next-line no-unused-vars
import { fillInput, selectDropdownOption, click, networkResource, storageResource } from '../utils/utils';
import * as kubevirtDetailView from '../../../views/kubevirt/kubevirtDetailView.view';
import { confirmAction, isLoaded, resourceRows } from '../../../views/crud.view';
import { DetailView } from './detailView';
import { TABS } from '../utils/consts';
import { diskTabCol, networkTabCol } from '../mocks';
import { browser } from 'protractor';


export class KubevirtDetailView extends DetailView {
  // TODO: Deprecate getAttachedResources and use specific methods instead (getAttachedDisks/getAttachedNics)
  async getAttachedResources(resourceTab: string): Promise<string[]> {
    await this.navigateToTab(resourceTab);
    await isLoaded();
    const resources = [];
    for (const row of await resourceRows) {
      resources.push(await row.$$('div').first().getText());
    }
    return resources;
  }

  async getAttachedDisks(): Promise<storageResource[]>{
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

  async getAttachedNics(): Promise<networkResource[]>{
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

  async waitForNewResourceRow() {
    // TODO: Remove when https://bugzilla.redhat.com/show_bug.cgi?id=1709939 is fixed
    const inputPresent = await kubevirtDetailView.newResourceRowInput.isPresent();
    await browser.sleep(300);
    return inputPresent && (await kubevirtDetailView.newResourceRowInput.isPresent());
  }

  async addDisk(disk: storageResource) {
    await this.navigateToTab(TABS.DISKS);
    await click(kubevirtDetailView.createDisk, 1000, this.waitForNewResourceRow);
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

  async addNic(nic: networkResource) {
    await this.navigateToTab(TABS.NICS);
    await click(kubevirtDetailView.createNic, 1000, this.waitForNewResourceRow);
    await fillInput(kubevirtDetailView.nicName, nic.name);
    await selectDropdownOption(kubevirtDetailView.networkTypeDropdownId, nic.networkDefinition);
    await selectDropdownOption(kubevirtDetailView.networkBindingId, nic.binding);
    await fillInput(kubevirtDetailView.macAddress, nic.mac);
    await click(kubevirtDetailView.applyBtn);
    await isLoaded();
  }

  async removeNic(name: string) {
    await this.navigateToTab(TABS.NICS);
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
  }
}
