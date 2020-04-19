/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { click, waitForCount } from '@console/shared/src/test-utils/utils';
import { resourceRows, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { clickHorizontalTab } from '@console/internal-integration-tests/views/horizontal-nav.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { TAB, diskTabCol, networkTabCol, PAGE_LOAD_TIMEOUT_SECS } from '../utils/consts';
import { StorageResource, NetworkResource, VirtualMachineTemplateModel } from '../utils/types';
import * as kubevirtDetailView from '../../views/kubevirtUIResource.view';
import { confirmAction } from '../../views/vm.actions.view';
import {
  vmDetailFlavorEditButton,
  vmDetailCdEditButton,
  vmDetailBootOrderEditButton,
  vmDetailDedicatedResourcesEditButton,
  vmDetailStatusEditButton,
  vmDetailNodeSelectorEditButton,
} from '../../views/virtualMachine.view';
import {
  activeTab,
  resourceHorizontalTab,
  getClusterNamespace,
  switchClusterNamespace,
} from '../../views/uiResource.view';
import * as vmsListView from '../../views/vms.list.view';
import * as editCD from '../../views/dialogs/editCDView';
import * as editBootOrder from '../../views/dialogs/editBootOrderView';
import * as editDedicatedResourcesView from '../../views/dialogs/editDedicatedResourcesView';
import * as editStatusView from '../../views/dialogs/editStatusView';
import * as editNodeSelectorView from '../../views/editNodeSelectorView';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { UIResource } from './uiResource';
import * as editFlavor from '../../views/dialogs/editFlavorView';
import { waitForNoLoaders } from '../../views/wizard.view';

export class KubevirtUIResource extends UIResource {
  async navigateToListView() {
    const currentUrl = await browser.getCurrentUrl();
    const vmsListUrl = (namespace) =>
      `${appHost}/k8s/${namespace === 'all-namespaces' ? '' : 'ns/'}${namespace}/virtualization`;

    if (![vmsListUrl(testName), vmsListUrl('all-namespaces')].includes(currentUrl)) {
      try {
        await clickNavLink(['Workloads', 'Virtualization']);
        if ((await getClusterNamespace()) !== this.namespace) {
          await switchClusterNamespace(this.namespace);
        }
        await isLoaded();
      } catch (e) {
        // clickNavLink may fail in case there is a overlay
        // Try to navigate using URL
        await browser.get(vmsListUrl(this.namespace));
        await isLoaded();
      }
    }
    if (this.kind.plural === VirtualMachineTemplateModel.plural) {
      await click(resourceHorizontalTab(VirtualMachineTemplateModel));
      await isLoaded();
    }
  }

  async navigateToTab(tabName: string) {
    if ((await this.getResourceTitle()) !== this.name) {
      await this.navigateToListView();
      await click(vmsListView.vmLinkByName(this.name));
      await isLoaded();
    }
    if ((await getClusterNamespace()) !== this.namespace) {
      await switchClusterNamespace(this.namespace);
    }

    if ((await activeTab.getText()) !== tabName) {
      await clickHorizontalTab(tabName);
      await isLoaded();
    }
  }

  async navigateToDetail() {
    await this.navigateToTab(TAB.Details);
    await isLoaded();
  }

  async navigateToOverview() {
    await this.navigateToTab(TAB.Overview);
    await isLoaded();
  }

  async navigateToConsoles() {
    await this.navigateToTab(TAB.Consoles);
    await isLoaded();
  }

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

  async modalEditFlavor() {
    await click(vmDetailFlavorEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editFlavor.modalTitle()));
    await waitForNoLoaders();
  }

  async modalEditCDRoms() {
    await click(vmDetailCdEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editCD.modalTitle));
    await isLoaded();
  }

  async modalEditBootOrder() {
    await click(vmDetailBootOrderEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editBootOrder.bootOrderDialog));
    await isLoaded();
  }

  async modalEditDedicatedResources() {
    // console.log('Opening modal');
    // await browser.sleep(2000);
    await click(vmDetailDedicatedResourcesEditButton(this.namespace, this.name));
    // console.log('Opened modall, waiting for checkbox');
    // await browser.sleep(2000);
    await browser.wait(until.presenceOf(editDedicatedResourcesView.guaranteedPolicyCheckbox));
    await isLoaded();
    // console.log('waiting done');
  }

  async modalEditStatus() {
    await click(vmDetailStatusEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editStatusView.unpauseVMDialog));
    await isLoaded();
  }

  async modalEditNodeSelector() {
    await click(vmDetailNodeSelectorEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editNodeSelectorView.modalTitle));
  }
}
