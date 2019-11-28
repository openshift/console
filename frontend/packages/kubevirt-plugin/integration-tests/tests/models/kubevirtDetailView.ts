/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { click, waitForCount } from '@console/shared/src/test-utils/utils';
import { resourceRows } from '@console/internal-integration-tests/views/crud.view';
import { TAB, diskTabCol, networkTabCol, PAGE_LOAD_TIMEOUT_SECS } from '../utils/consts';
import { StorageResource, NetworkResource } from '../utils/types';
import * as kubevirtDetailView from '../../views/kubevirtDetailView.view';
import { confirmAction } from '../../views/vm.actions.view';
import { vmDetailFlavorEditButton, vmDetailCdEditButton } from '../../views/virtualMachine.view';
import * as editCD from '../../views/editCDView';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { DetailView } from './detailView';
import * as editFlavor from './editFlavorView';

export class KubevirtDetailView extends DetailView {
  async getAttachedDisks(): Promise<StorageResource[]> {
    await this.navigateToTab(TAB.Disks);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[diskTabCol.name],
        size: cols[diskTabCol.size].slice(0, -4),
        interface: cols[diskTabCol.interface],
        storageClass: cols[diskTabCol.storageClass],
      };
    });
  }

  async getAttachedNICs(): Promise<NetworkResource[]> {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[networkTabCol.name],
        model: cols[networkTabCol.model],
        mac: cols[networkTabCol.mac],
        network: cols[networkTabCol.network],
        type: cols[networkTabCol.type],
      };
    });
  }

  async addDisk(disk: StorageResource) {
    await this.navigateToTab(TAB.Disks);
    const count = await resourceRows.count();
    await click(kubevirtDetailView.createDiskButton);
    const dialog = new DiskDialog();
    await dialog.create(disk);
    await browser.wait(until.and(waitForCount(resourceRows, count + 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async removeDisk(name: string) {
    await this.navigateToTab(TAB.Disks);
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async addNIC(nic: NetworkResource) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const count = await resourceRows.count();
    await click(kubevirtDetailView.createNICButton);
    const dialog = new NetworkInterfaceDialog();
    await dialog.create(nic);
    await browser.wait(until.and(waitForCount(resourceRows, count + 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async removeNIC(name: string) {
    await this.navigateToTab(TAB.NetworkInterfaces);
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
