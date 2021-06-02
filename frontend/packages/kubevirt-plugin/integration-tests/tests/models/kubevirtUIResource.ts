/* eslint-disable no-await-in-loop */
import * as _ from 'lodash';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { clickHorizontalTab } from '@console/internal-integration-tests/views/horizontal-nav.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { K8sKind } from '@console/internal/module/k8s';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { confirmAction } from '@console/shared/src/test-utils/actions.view';
import { click } from '@console/shared/src/test-utils/utils';
import * as editDedicatedResourcesView from '../../views/dialogs/editDedicatedResourcesView';
import * as editStatusView from '../../views/dialogs/editStatusView';
import * as kubevirtDetailView from '../../views/kubevirtUIResource.view';
import {
  activeTab,
  getClusterNamespace,
  resourceHorizontalTab,
  switchClusterNamespace,
} from '../../views/uiResource.view';
import {
  vmDetailAffinityEditButton,
  vmDetailBootOrderEditButton,
  vmDetailDedicatedResourcesEditButton,
  vmDetailFlavorEditButton,
  vmDetailNodeSelectorEditButton,
  vmDetailstatusButton,
  vmDetailTolerationsEditButton,
} from '../../views/virtualMachine.view';
import * as disksView from '../../views/vm.disks.view';
import * as vmsListView from '../../views/vms.list.view';
import { waitForNoLoaders } from '../../views/wizard.view';
import { DiskDialog } from '../dialogs/diskDialog';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { Disk, Network, VirtualMachineTemplateModel } from '../types/types';
import { BaseVMBuilderData } from '../types/vm';
import { PAGE_LOAD_TIMEOUT_SECS } from '../utils/constants/common';
import { diskTabCol, networkTabCol, TAB } from '../utils/constants/vm';
import { UIResource } from './uiResource';

export class KubevirtUIResource<T extends BaseVMBuilderData> extends UIResource {
  protected data: T;

  constructor(data: T, model: K8sKind) {
    super({ name: data.name, namespace: data.namespace, model });
    this.data = data;
  }

  async isOnListView(): Promise<boolean> {
    const currentUrl = await browser.getCurrentUrl();
    if (!(await vmsListView.virtualizationTitle.isPresent())) {
      return false;
    }
    if (this.model === VirtualMachineTemplateModel) {
      return currentUrl.endsWith('/virtualization/templates');
    }
    const virtualizationURLs = (namespace) =>
      `${appHost}/k8s/${namespace === 'all-namespaces' ? '' : 'ns/'}${namespace}/virtualization`;
    return [virtualizationURLs(testName), virtualizationURLs('all-namespaces')].includes(
      currentUrl,
    );
  }

  async isOnDetailView(): Promise<boolean> {
    if (this.model === VirtualMachineTemplateModel) {
      if (await kubevirtDetailView.resourceTitleLink('Templates').isPresent()) {
        return true;
      }
    }
    if (this.model === VirtualMachineModel) {
      return (await this.getResourceTitle()) === this.name;
    }
    return false;
  }

  async navigateToListView() {
    if (!(await this.isOnListView())) {
      try {
        await clickNavLink(['Workloads', 'Virtualization']);
        await isLoaded();
        if ((await getClusterNamespace()) !== this.namespace) {
          await switchClusterNamespace(this.namespace);
        }
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

  async navigateToSnapshots() {
    await this.navigateToTab(TAB.Snapshots);
    await isLoaded();
  }

  async navigateToDisks() {
    await this.navigateToTab(TAB.Disks);
    await isLoaded();
    await browser.wait(until.presenceOf(disksView.diskRows));
  }

  async navigateToNICs() {
    await this.navigateToTab(TAB.NetworkInterfaces);
    await isLoaded();
  }

  async getAttachedDisks(): Promise<Disk[]> {
    await this.navigateToTab(TAB.Disks);
    await browser.wait(until.presenceOf(disksView.diskRows));
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((row: string) => {
      const newRow = row.replace('(pending restart)\n', ''); // if disk added when VM was up
      const cols = newRow.split(/\n/);
      return {
        name: cols[diskTabCol.name],
        size: cols[diskTabCol.size]?.slice(0, -4),
        drive: cols[diskTabCol.drive],
        interface: cols[diskTabCol.interface],
        storageClass: cols[diskTabCol.storageClass],
      };
    });
  }

  async getAttachedNICs(): Promise<Network[]> {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((row: string) => {
      const newRow = row.replace('(pending restart)\n', ''); // if Nic added when VM was up
      const cols = newRow.split(/\n/);
      return {
        name: cols[networkTabCol.name],
        model: cols[networkTabCol.model],
        mac: cols[networkTabCol.mac],
        network: cols[networkTabCol.network],
        type: _.capitalize(cols[networkTabCol.type]),
      };
    });
  }

  async addDisk(disk: Disk) {
    await this.navigateToTab(TAB.Disks);
    await click(kubevirtDetailView.createDiskButton);
    const dialog = new DiskDialog();
    await dialog.create(disk);
    await isLoaded();
    await browser.wait(
      until.presenceOf(kubevirtDetailView.dataID(disk.name)),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }

  async removeDisk(name: string) {
    await this.navigateToTab(TAB.Disks);
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await isLoaded();
    await browser.wait(until.stalenessOf(kubevirtDetailView.dataID(name)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async addNIC(nic: Network) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    await click(kubevirtDetailView.createNICButton);
    const dialog = new NetworkInterfaceDialog();
    await dialog.create(nic);
    await isLoaded();
    await browser.wait(
      until.presenceOf(kubevirtDetailView.dataID(nic.name)),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }

  async removeNIC(name: string) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await isLoaded();
    await browser.wait(until.stalenessOf(kubevirtDetailView.dataID(name)), PAGE_LOAD_TIMEOUT_SECS);
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
    await click(vmDetailstatusButton());
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
