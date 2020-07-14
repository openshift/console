import * as _ from 'lodash';
import { browser, ExpectedConditions as until } from 'protractor';
import { isLoaded, resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { selectDropdownOption, resolveTimeout } from '@console/shared/src/test-utils/utils';
import { KubevirtUIResource } from './kubevirtUIResource';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
  UNEXPECTED_ACTION_ERROR,
  VM_ACTIONS_TIMEOUT_SECS,
  VM_STOP_TIMEOUT_SECS,
} from '../utils/constants/common';
import * as vmView from '../../views/virtualMachine.view';
import { nameInput as cloneDialogNameInput } from '../../views/dialogs/cloneVirtualMachineDialog.view';
import { TAB, VM_ACTION, VMI_ACTION, VM_STATUS } from '../utils/constants/vm';
import { Disk, Network } from '../types/types';
import { VMBuilderData } from '../types/vm';

export class BaseVirtualMachine extends KubevirtUIResource<VMBuilderData> {
  async waitForStatus(status: string, timeout?: number) {
    await this.navigateToTab(TAB.Details);
    await browser.wait(
      until.textToBePresentInElement(vmView.vmDetailStatus(this.namespace, this.name), status),
      resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
    );
  }

  protected hasResource(resources, resource) {
    const found = _.find(resources, (o) => o.name === resource.name);
    if (found) {
      return _.isEqual(found, _.pick(resource, Object.keys(found)));
    }
    return false;
  }

  async hasDisk(disk: Disk) {
    const disks = await this.getAttachedDisks();
    return this.hasResource(disks, disk);
  }

  async hasNIC(nic: Network) {
    const nics = await this.getAttachedNICs();
    return this.hasResource(nics, nic);
  }

  async getStatus(): Promise<string> {
    return vmView.vmDetailStatus(this.namespace, this.name).getText();
  }

  async getNode(): Promise<string> {
    return vmView.vmDetailNode(this.namespace, this.name).getText();
  }

  async getBootDevices(): Promise<string[]> {
    return vmView.vmDetailBootOrder(this.namespace, this.name).getText();
  }

  async selectConsole(type: string) {
    await selectDropdownOption(vmView.consoleSelectorDropdownId, type);
    await isLoaded();
  }

  async getConsoleVmIpAddress(): Promise<string> {
    await browser.wait(until.presenceOf(vmView.rdpIpAddress), PAGE_LOAD_TIMEOUT_SECS);
    return vmView.rdpIpAddress.getText();
  }

  async getConsoleRdpPort(): Promise<string> {
    await browser.wait(until.presenceOf(vmView.rdpPort), PAGE_LOAD_TIMEOUT_SECS);
    return vmView.rdpPort.getText();
  }

  async waitForActionFinished(action: VM_ACTION | VMI_ACTION, timeout?: number) {
    await this.navigateToTab(TAB.Details);
    switch (action) {
      case VM_ACTION.Start:
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Restart:
        await browser.wait(
          until.or(
            until.textToBePresentInElement(
              vmView.vmDetailStatus(this.namespace, this.name),
              VM_STATUS.Error,
            ),
            until.textToBePresentInElement(
              vmView.vmDetailStatus(this.namespace, this.name),
              VM_STATUS.Starting,
            ),
          ),
          resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
        );
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Stop:
        await this.waitForStatus(VM_STATUS.Off, resolveTimeout(timeout, VM_STOP_TIMEOUT_SECS));
        break;
      case VM_ACTION.Clone:
        await browser.wait(
          until.visibilityOf(cloneDialogNameInput),
          resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Migrate:
        await this.waitForStatus(
          VM_STATUS.Migrating,
          resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
        );
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, VM_ACTIONS_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Cancel:
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Delete:
        // wait for redirect
        await browser.wait(
          until.textToBePresentInElement(resourceTitle, 'Virtual Machines'),
          resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Unpause:
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, VM_ACTIONS_TIMEOUT_SECS),
        );
        break;
      default:
        throw Error(UNEXPECTED_ACTION_ERROR);
    }
  }
}
