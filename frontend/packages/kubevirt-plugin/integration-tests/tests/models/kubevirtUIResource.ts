/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { click, waitForCount } from '@console/shared/src/test-utils/utils';
import { confirmAction } from '@console/shared/src/test-utils/actions.view';
import { resourceRows, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { clickHorizontalTab } from '@console/internal-integration-tests/views/horizontal-nav.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { PAGE_LOAD_TIMEOUT_SECS } from '../utils/constants/common';
import { Disk, Network, VirtualMachineTemplateModel } from '../types/types';
import * as kubevirtDetailView from '../../views/kubevirtUIResource.view';
import {
  vmDetailFlavorEditButton,
  vmDetailBootOrderEditButton,
  vmDetailDedicatedResourcesEditButton,
  vmDetailStatusEditButton,
  vmDetailNodeSelectorEditButton,
  vmDetailTolerationsEditButton,
  vmDetailAffinityEditButton,
} from '../../views/virtualMachine.view';
import {
  activeTab,
  resourceHorizontalTab,
  getClusterNamespace,
  switchClusterNamespace,
} from '../../views/uiResource.view';
import * as vmsListView from '../../views/vms.list.view';
import * as editDedicatedResourcesView from '../../views/dialogs/editDedicatedResourcesView';
import * as editStatusView from '../../views/dialogs/editStatusView';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { UIResource } from './uiResource';
import { waitForNoLoaders } from '../../views/wizard.view';
import { TAB, diskTabCol, networkTabCol } from '../utils/constants/vm';
import { BaseVMBuilderData } from '../types/vm';
import { K8sKind } from '@console/internal/module/k8s';

export class KubevirtUIResource<T extends BaseVMBuilderData> extends UIResource {
  protected data: T;

  constructor(data: T, model: K8sKind) {
    super({ name: data.name, namespace: data.namespace, model });
    this.data = data;
  }

  async isOnListView(): Promise<boolean> {
    const currentUrl = await browser.getCurrentUrl();
    const virtualizationURLs = (namespace) =>
      `${appHost}/k8s/${namespace === 'all-namespaces' ? '' : 'ns/'}${namespace}/virtualization`;
    return [virtualizationURLs(testName), virtualizationURLs('all-namespaces')].includes(
      currentUrl,
    );
  }

  async isOnDetailView(): Promise<boolean> {
    return (await this.getResourceTitle()) === this.name;
  }

  async navigateToListView() {
    if (!(await this.isOnListView())) {
      try {
        await clickNavLink(['Workloads', 'Virtualization']);
        if ((await getClusterNamespace()) !== this.namespace) {
          await switchClusterNamespace(this.namespace);
        }
        await isLoaded();
      } catch (e) {
        // clickNavLink may fail in case there is a overlay
        // Try to navigate using URL
        await browser.get(`${appHost}/k8s/ns/${this.namespace}/virtualization`);
        await isLoaded();
      }
    }
    if (this.model === VirtualMachineTemplateModel) {
      await click(resourceHorizontalTab(VirtualMachineTemplateModel));
      await isLoaded();
    }
  }

  async navigateToTab(tabName: string) {
    if (!(await this.isOnDetailView())) {
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

  async navigateToOverview() {
    await this.navigateToTab(TAB.Overview);
    await isLoaded();
  }

  async navigateToYAML() {
    await this.navigateToTab(TAB.Yaml);
    await isLoaded();
  }

  async navigateToDetail() {
    await this.navigateToTab(TAB.Details);
    await isLoaded();
  }

  async navigateToConsole() {
    await this.navigateToTab(TAB.Console);
    await isLoaded();
  }

  async navigateToEnvironment() {
    await this.navigateToTab(TAB.Environment);
    await isLoaded();
  }

  async navigateToDisks() {
    await this.navigateToTab(TAB.Disks);
    await isLoaded();
  }

  async navigateToNICs() {
    await this.navigateToTab(TAB.NetworkInterfaces);
    await isLoaded();
  }

  async getAttachedDisks(): Promise<Disk[]> {
    await this.navigateToTab(TAB.Disks);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[diskTabCol.name],
        size: cols[diskTabCol.size].slice(0, -4),
        drive: cols[diskTabCol.drive],
        interface: cols[diskTabCol.interface],
        storageClass: cols[diskTabCol.storageClass],
      };
    });
  }

  async getAttachedNICs(): Promise<Network[]> {
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

  async addDisk(disk: Disk) {
    await this.navigateToTab(TAB.Disks);
    const count = await resourceRows.count();
    await click(kubevirtDetailView.createDiskButton);
    const dialog = new DiskDialog();
    await dialog.create(disk);
    await isLoaded();
    await browser.wait(until.and(waitForCount(resourceRows, count + 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async removeDisk(name: string) {
    await this.navigateToTab(TAB.Disks);
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await isLoaded();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async addNIC(nic: Network) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const count = await resourceRows.count();
    await click(kubevirtDetailView.createNICButton);
    const dialog = new NetworkInterfaceDialog();
    await dialog.create(nic);
    await isLoaded();
    await browser.wait(until.and(waitForCount(resourceRows, count + 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async removeNIC(name: string) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await isLoaded();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async modalEditFlavor() {
    await click(vmDetailFlavorEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(kubevirtDetailView.modalTitle));
    await waitForNoLoaders();
  }

  async modalEditBootOrder() {
    await click(vmDetailBootOrderEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(kubevirtDetailView.modalTitle));
    await isLoaded();
  }

  async modalEditDedicatedResources() {
    await click(vmDetailDedicatedResourcesEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editDedicatedResourcesView.guaranteedPolicyCheckbox));
    await isLoaded();
  }

  async modalEditStatus() {
    await click(vmDetailStatusEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editStatusView.unpauseVMDialog));
    await isLoaded();
  }

  async modalEditNodeSelector() {
    await click(vmDetailNodeSelectorEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(kubevirtDetailView.modalTitle));
  }

  async modalEditTolerations() {
    await click(vmDetailTolerationsEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(kubevirtDetailView.modalTitle));
  }

  async modalEditAffinity() {
    await click(vmDetailAffinityEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(kubevirtDetailView.modalTitle));
  }
}
