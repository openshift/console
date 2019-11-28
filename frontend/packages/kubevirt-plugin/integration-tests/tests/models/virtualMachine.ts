/* eslint-disable no-await-in-loop, no-console */
import { browser, ExpectedConditions as until } from 'protractor';
import { isLoaded, resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import {
  selectDropdownOption,
  waitForStringNotInElement,
  resolveTimeout,
} from '@console/shared/src/test-utils/utils';
import * as vmView from '../../views/virtualMachine.view';
import { VMConfig } from '../utils/types';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
  VM_ACTION,
  TAB,
  VM_IMPORT_TIMEOUT_SECS,
  UNEXPECTED_ACTION_ERROR,
  VM_ACTIONS_TIMEOUT_SECS,
  VM_STOP_TIMEOUT_SECS,
  VM_STATUS,
  CONFIG_NAME_URL,
  CONFIG_NAME_PXE,
  CONFIG_NAME_DISK,
} from '../utils/consts';
import { detailViewAction, listViewAction } from '../../views/vm.actions.view';
import { nameInput as cloneDialogNameInput } from '../../views/dialogs/cloneVirtualMachineDialog.view';
import { Wizard } from './wizard';
import { KubevirtDetailView } from './kubevirtDetailView';

export class VirtualMachine extends KubevirtDetailView {
  constructor(config) {
    super({ ...config, kind: 'virtualmachines' });
  }

  async getStatus(): Promise<string> {
    return vmView.vmDetailStatus(this.namespace, this.name);
  }

  async getNode(): Promise<string> {
    return vmView.vmDetailNode(this.namespace, this.name);
  }

  async action(action: VM_ACTION, waitForAction?: boolean, timeout?: number) {
    await this.navigateToTab(TAB.Overview);

    let confirmDialog = true;
    if ([VM_ACTION.Clone].includes(action)) {
      confirmDialog = false;
    }

    await detailViewAction(action, confirmDialog);
    if (waitForAction !== false) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async listViewAction(action: string, waitForAction?: boolean, timeout?: number) {
    await this.navigateToListView();

    let confirmDialog = true;
    if ([VM_ACTION.Clone as string].includes(action)) {
      confirmDialog = false;
    }
    await listViewAction(this.name)(action, confirmDialog);
    if (waitForAction !== false) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async waitForStatus(status: string, timeout?: number) {
    await this.navigateToTab(TAB.Overview);
    await browser.wait(
      until.textToBePresentInElement(vmView.vmDetailStatus(this.namespace, this.name), status),
      resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
    );
  }

  async waitForActionFinished(action: string, timeout?: number) {
    await this.navigateToTab(TAB.Overview);
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
      default:
        throw Error(UNEXPECTED_ACTION_ERROR);
    }
  }

  async waitForMigrationComplete(fromNode: string, timeout: number) {
    await this.waitForStatus(VM_STATUS.Running, VM_MIGRATION_TIMEOUT_SECS);
    await browser.wait(
      waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), fromNode),
      timeout,
    );
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

  async create({
    name,
    description,
    template,
    provisionSource,
    operatingSystem,
    flavor,
    workloadProfile,
    startOnCreation,
    cloudInit,
    storageResources,
    networkResources,
  }: VMConfig) {
    const wizard = new Wizard();
    await this.navigateToListView();
    await wizard.openWizard();
    if (template !== undefined) {
      await wizard.selectTemplate(template);
    } else {
      await wizard.selectProvisionSource(provisionSource);
      await wizard.selectOperatingSystem(operatingSystem);
      await wizard.selectWorkloadProfile(workloadProfile);
    }
    await wizard.selectFlavor(flavor);
    await wizard.fillName(name);
    await wizard.fillDescription(description);
    if (startOnCreation) {
      await wizard.startOnCreation();
    }
    await wizard.next();

    // Networking
    for (const resource of networkResources) {
      await wizard.addNIC(resource);
    }
    if (provisionSource.method === CONFIG_NAME_PXE && template === undefined) {
      // Select the last NIC as the source for booting
      await wizard.selectBootableNIC(networkResources[networkResources.length - 1].network);
    }
    await wizard.next();

    // Storage
    for (const resource of storageResources) {
      if (resource.name === 'rootdisk' && provisionSource.method === CONFIG_NAME_URL) {
        await wizard.editDisk(resource.name, resource);
      } else {
        await wizard.addDisk(resource);
      }
    }
    if (provisionSource.method === CONFIG_NAME_DISK) {
      // Select the last Disk as the source for booting
      await wizard.selectBootableDisk(storageResources[storageResources.length - 1].name);
    }
    await wizard.next();

    // Advanced - Cloud Init
    if (cloudInit.useCloudInit) {
      if (template !== undefined) {
        // TODO: wizard.useCloudInit needs to check state of checkboxes before clicking them to ensure desired state is achieved with specified template
        throw new Error('Using cloud init with template not implemented.');
      }
      await wizard.configureCloudInit(cloudInit);
    }
    await wizard.next();
    // Review page
    await wizard.confirmAndCreate();
    await wizard.waitForCreation();

    await this.navigateToTab(TAB.Overview);
    if (startOnCreation === true) {
      // If startOnCreation is true, wait for VM to boot up
      await this.waitForStatus(VM_STATUS.Running, VM_BOOTUP_TIMEOUT_SECS);
    } else {
      // Else wait for possible import to finish
      await this.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
    }
  }
}
