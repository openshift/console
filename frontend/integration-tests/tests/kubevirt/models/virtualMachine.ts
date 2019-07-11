/* eslint-disable no-unused-vars, no-undef */
import { browser, ExpectedConditions as until } from 'protractor';

import { testName } from '../../../protractor.conf';
import * as vmView from '../../../views/kubevirt/virtualMachine.view';
import { nameInput, errorMessage } from '../../../views/kubevirt/wizard.view';
import { resourceTitle, isLoaded, filterForName, resourceRowsPresent } from '../../../views/crud.view';
import { selectDropdownOption, waitForStringNotInElement, resolveTimeout } from '../utils/utils';
import { provisionOption, networkResource, storageResource, cloudInitConfig } from '../utils/types';
import { PAGE_LOAD_TIMEOUT, VM_BOOTUP_TIMEOUT, VM_STOP_TIMEOUT, VM_ACTIONS_TIMEOUT, WIZARD_CREATE_VM_ERROR, UNEXPECTED_ACTION_ERROR, TABS, WIZARD_TABLE_FIRST_ROW, DASHES } from '../utils/consts';
import { VirtualMachineInstance } from './virtualMachineInstance';
import { detailViewAction } from '../../../views/kubevirt/vm-actions.view';
import Wizard from './wizard';
import { KubevirtDetailView } from './kubevirtDetailView';
import { rowForName } from '../../../views/kubevirt/kubevirtDetailView.view';


export class VirtualMachine extends KubevirtDetailView {
  constructor(vmConfig) {
    super({...vmConfig, kind: 'virtualmachines'});
  }

  async navigateToVmi(vmiTab: string): Promise<VirtualMachineInstance> {
    await this.navigateToTab(TABS.OVERVIEW);
    const vmPodName = await vmView.vmDetailPod(this.namespace, this.name).$('a').getText();
    const vmi = new VirtualMachineInstance({name: vmPodName, namespace: testName});
    await vmi.navigateToTab(vmiTab);
    return vmi;
  }

  async action(action: string, waitForAction?: boolean, timeout?: number) {
    await this.navigateToTab(TABS.OVERVIEW);

    let confirmDialog = true;
    if (['Clone'].includes(action)) {
      confirmDialog = false;
    }

    await detailViewAction(action, confirmDialog);
    if (waitForAction !== false) {
      switch (action) {
        case 'Start':
          await this.waitForStatusIcon(vmView.statusIcons.running, resolveTimeout(timeout, VM_BOOTUP_TIMEOUT));
          break;
        case 'Restart':
          await this.waitForStatusIcon(vmView.statusIcons.starting, resolveTimeout(timeout, VM_BOOTUP_TIMEOUT));
          await this.waitForStatusIcon(vmView.statusIcons.running, resolveTimeout(timeout, VM_BOOTUP_TIMEOUT));
          break;
        case 'Stop':
          await this.waitForStatusIcon(vmView.statusIcons.off, resolveTimeout(timeout, VM_STOP_TIMEOUT));
          break;
        case 'Clone':
          await browser.wait(until.presenceOf(nameInput), resolveTimeout(timeout, PAGE_LOAD_TIMEOUT));
          await browser.sleep(500); // Wait until the fade in effect is finished, otherwise we may misclick
          break;
        case 'Migrate':
          await this.waitForStatusIcon(vmView.statusIcons.migrating, resolveTimeout(timeout, PAGE_LOAD_TIMEOUT));
          await this.waitForStatusIcon(vmView.statusIcons.running, resolveTimeout(timeout, VM_ACTIONS_TIMEOUT));
          break;
        case 'Cancel':
          await this.waitForStatusIcon(vmView.statusIcons.running, resolveTimeout(timeout, PAGE_LOAD_TIMEOUT));
          break;
        case 'Delete':
          // wait for redirect
          await browser.wait(until.textToBePresentInElement(resourceTitle, 'Virtual Machines'),resolveTimeout(timeout, PAGE_LOAD_TIMEOUT));
          break;
        default:
          throw Error(UNEXPECTED_ACTION_ERROR);
      }
    }
  }

  async waitForStatusIcon(statusIcon: string, timeout: number) {
    await this.navigateToTab(TABS.OVERVIEW);
    await browser.wait(until.presenceOf(vmView.statusIcon(statusIcon)), timeout);
  }

  async waitForMigrationComplete(fromNode: string, timeout: number) {
    await browser.wait(until.and(
      waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), fromNode),
      waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), DASHES)), timeout);
  }

  async resourceExists(resourceName:string) {
    return rowForName(resourceName).isPresent();
  }

  async selectConsole(type: string) {
    await selectDropdownOption(vmView.consoleSelectorDropdownId, type);
    await isLoaded();
  }

  async getConsoleVmIpAddress(): Promise<string> {
    await browser.wait(until.presenceOf(vmView.rdpIpAddress), PAGE_LOAD_TIMEOUT);
    return vmView.rdpIpAddress.getText();
  }

  async getConsoleRdpPort(): Promise<string> {
    await browser.wait(until.presenceOf(vmView.rdpPort), PAGE_LOAD_TIMEOUT);
    return vmView.rdpPort.getText();
  }

  async create({
    name,
    namespace,
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
  }: {
  name: string,
  namespace: string,
  description: string,
  template?: string,
  provisionSource?: provisionOption,
  operatingSystem?: string,
  flavor?: string,
  workloadProfile?: string,
  startOnCreation: boolean,
  cloudInit: cloudInitConfig,
  storageResources: storageResource[],
  networkResources: networkResource[],
  }) {
    const wizard = new Wizard();
    await this.navigateToListView();

    await wizard.openWizard();
    await wizard.fillName(name);
    await wizard.fillDescription(description);
    if (!(await browser.getCurrentUrl()).includes(`${testName}/${this.kind}`)) {
      await wizard.selectNamespace(namespace);
    }
    if (template !== undefined) {
      await wizard.selectTemplate(template);

    } else {
      await wizard.selectProvisionSource(provisionSource);
      await wizard.selectOperatingSystem(operatingSystem);
      await wizard.selectWorkloadProfile(workloadProfile);
    }
    await wizard.selectFlavor(flavor);
    if (startOnCreation) {
      await wizard.startOnCreation();
    }
    if (cloudInit.useCloudInit) {
      if (template !== undefined) {
        // TODO: wizard.useCloudInit needs to check state of checkboxes before clicking them to ensure desired state is achieved with specified template
        throw new Error('Using cloud init with template not implemented.');
      }
      await wizard.useCloudInit(cloudInit);
    }
    await wizard.next();

    // Networking
    for (const resource of networkResources) {
      await wizard.addNic(resource.name, resource.mac, resource.networkDefinition, resource.binding);
    }
    await wizard.next();

    // Storage
    for (const resource of storageResources) {
      if (resource.name === 'rootdisk' && provisionSource.method === 'URL') {
        // Rootdisk is present by default, only edit specific properties
        await wizard.editDiskAttribute(WIZARD_TABLE_FIRST_ROW, 'size', resource.size);
        await wizard.editDiskAttribute(WIZARD_TABLE_FIRST_ROW, 'storage', resource.storageClass);
      } else if (resource.attached === true) {
        await wizard.attachDisk(resource);
      } else {
        await wizard.addDisk(resource);
      }
    }

    // Create VM
    await wizard.next();
    await wizard.waitForCreation();

    // Check for errors and close wizard
    if (await errorMessage.isPresent()) {
      console.error(await errorMessage.getText());
      throw new Error(WIZARD_CREATE_VM_ERROR);
    }
    await wizard.next();

    if (startOnCreation === true) {
      // If startOnCreation is true, wait for VM to boot up
      await this.waitForStatusIcon(vmView.statusIcons.running, VM_BOOTUP_TIMEOUT);
    } else {
      // Else wait for it to appear in list view
      await this.navigateToListView();
      await filterForName(name);
      await resourceRowsPresent();
    }
  }

}
