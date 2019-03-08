/* eslint-disable no-unused-vars, no-undef */
import { browser, ExpectedConditions as until } from 'protractor';

import { testName } from '../../../protractor.conf';
import * as vmView from '../../../views/kubevirt/virtualMachine.view';
import { confirmAction, resourceRows, isLoaded } from '../../../views/crud.view';
import { fillInput, PAGE_LOAD_TIMEOUT, selectDropdownOption, VM_BOOTUP_TIMEOUT, VM_STOP_TIMEOUT } from '../utils';
import { DetailView } from './detailView';
import { VirtualMachineInstance } from './VirtualMachineInstance';
import { detailViewVmIcon, detailViewAction, runningIcon, pendingIcon, offIcon } from '../../../views/kubevirt/vm.actions.view';

export class VirtualMachine extends DetailView {
  constructor(name: string, namespace: string) {
    super(name, namespace, 'virtualmachines');
  }

  async navigateToVmi(vmiTab: string): Promise<VirtualMachineInstance> {
    await this.navigateToTab(vmView.overviewTab).then(() => isLoaded());
    await browser.wait(until.elementToBeClickable(vmView.statusLink))
      .then(async() => await vmView.statusLink.click())
      .then(async() => await isLoaded());
    const vmi = new VirtualMachineInstance(await DetailView.getResourceTitle(), testName);
    await vmi.navigateToTab(vmiTab);
    return vmi;
  }

  async action(action: string) {
    await this.navigateToTab(vmView.overviewTab);
    await detailViewAction(action);
    switch (action) {
      case 'Start':
        await browser.wait(until.presenceOf(detailViewVmIcon(runningIcon)), VM_BOOTUP_TIMEOUT);
        break;
      case 'Restart':
        await browser.wait(until.presenceOf(detailViewVmIcon(pendingIcon)), VM_BOOTUP_TIMEOUT);
        await browser.wait(until.presenceOf(detailViewVmIcon(runningIcon)), VM_BOOTUP_TIMEOUT);
        break;
      case 'Stop':
        await browser.wait(until.presenceOf(detailViewVmIcon(offIcon)), VM_STOP_TIMEOUT);
        break;
      case 'Delete':
        // wait for redirect
        await browser.wait(until.textToBePresentInElement(vmView.resourceTitle, 'Virtual Machines'), PAGE_LOAD_TIMEOUT);
        break;
      default:
        throw Error('Received unexpected action.');
    }
  }

  async getAttachedResources(resourceTab: string): Promise<string[]> {
    await this.navigateToTab(resourceTab);
    const resources = [];
    await browser.sleep(500);
    for (const row of await resourceRows) {
      resources.push(await row.$$('div').first().getText());
    }
    return resources;
  }

  async resourceExists(resourceName) {
    return vmView.rowForName(resourceName).isPresent();
  }

  async addDisk(name: string, size: string, storageClass: string) {
    await this.navigateToTab(vmView.disksTab);
    await vmView.createDisk.click();
    await fillInput(vmView.diskName, name);
    await fillInput(vmView.diskSize, size);
    await selectDropdownOption(vmView.diskStorageClassDropdownId, storageClass);
    await vmView.applyBtn.click();
  }

  async removeDisk(name: string) {
    await this.navigateToTab(vmView.disksTab);
    await vmView.selectKebabOption(name, 'Delete');
    await confirmAction();
  }

  async addNic(name: string, mac: string, networkAttachmentDefinition: string) {
    await this.navigateToTab(vmView.nicsTab);
    await vmView.createNic.click();
    await fillInput(vmView.nicName, name);
    await fillInput(vmView.macAddress, mac);
    await selectDropdownOption(vmView.networkTypeDropdownId, networkAttachmentDefinition);
    await vmView.applyBtn.click();
  }

  async removeNic(name: string) {
    await this.navigateToTab(vmView.nicsTab);
    await vmView.selectKebabOption(name, 'Delete');
    await confirmAction();
  }
}
