/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { isLoaded, resourceRows } from '@console/internal-integration-tests/views/crud.view';
import { selectDropdownOption, click, waitForCount } from '@console/shared/src/test-utils/utils';
import { TABS, diskTabCol, networkTabCol, PAGE_LOAD_TIMEOUT_SECS } from '../utils/consts';
import { StorageResource, NetworkResource } from '../utils/types';
import { fillInput } from '../utils/utils';
import * as kubevirtDetailView from '../../views/kubevirtDetailView.view';
import { confirmAction } from '../../views/vm.actions.view';
import { vmDetailFlavorEditButton, vmDetailCdEditButton } from '../../views/virtualMachine.view';
import * as editCD from '../../views/editCDView';
import { DetailView } from './detailView';
import * as editFlavor from './editFlavorView';

export class KubevirtDetailView extends DetailView {
  async getAttachedDisks(): Promise<StorageResource[]> {
    await this.navigateToTab(TABS.DISKS);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\s+/);
      return {
        name: cols[diskTabCol.name],
        size: cols[diskTabCol.size].slice(0, -2),
        storageClass: cols[diskTabCol.storageClass],
      };
    });
  }

  async getAttachedNICs(): Promise<NetworkResource[]> {
    await this.navigateToTab(TABS.NICS);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\s+/);
      return {
        name: cols[networkTabCol.name],
        mac: cols[networkTabCol.mac],
        networkDefinition: cols[networkTabCol.networkDefinition],
        binding: cols[networkTabCol.binding],
      };
    });
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
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
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
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  // pops-up modal dialog
  async modalEditFlavor() {
    await click(vmDetailFlavorEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editFlavor.modalTitle()));
  }

  async modalEditCDRoms() {
    await click(vmDetailCdEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editCD.modalTitle));
  }
}
