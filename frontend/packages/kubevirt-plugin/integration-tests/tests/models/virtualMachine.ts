/* eslint-disable no-await-in-loop, no-console */
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '../../../../../integration-tests/protractor.conf';
import { isLoaded } from '../../../../../integration-tests/views/crud.view';
import {
  selectDropdownOption,
  waitForStringNotInElement,
} from '../../../../console-shared/src/test-utils/utils';
import * as vmView from '../../views/virtualMachine.view';
import { errorMessage } from '../../views/wizard.view';
import { VMConfig } from '../utils/types';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
  WIZARD_CREATE_VM_ERROR,
  WIZARD_TABLE_FIRST_ROW,
  TABS,
  DASH,
} from '../utils/consts';
import { detailViewAction } from '../../views/vm.actions.view';
import { tableRowForName } from '../../views/kubevirtDetailView.view';
import { Wizard } from './wizard';
import { KubevirtDetailView } from './kubevirtDetailView';
import { VirtualMachineInstance } from './virtualMachineInstance';

export class VirtualMachine extends KubevirtDetailView {
  constructor(config) {
    super({ ...config, kind: 'virtualmachines' });
  }

  async navigateToVMI(vmiTab: string): Promise<VirtualMachineInstance> {
    await this.navigateToTab(TABS.OVERVIEW);
    const vmPodName = await vmView
      .vmDetailPod(this.namespace, this.name)
      .$('a')
      .getText();
    const vmi = new VirtualMachineInstance({ name: vmPodName, namespace: testName });
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
      await vmView.waitForActionFinished(action, timeout);
    }
  }

  async waitForMigrationComplete(fromNode: string, timeout: number) {
    await browser.wait(
      until.and(
        waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), fromNode),
        waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), DASH),
      ),
      timeout,
    );
  }

  async resourceExists(resourceName: string) {
    return tableRowForName(resourceName).isPresent();
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
  }: VMConfig) {
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
      await wizard.addNIC(
        resource.name,
        resource.mac,
        resource.networkDefinition,
        resource.binding,
      );
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
      await vmView.waitForStatusIcon(vmView.statusIcons.running, VM_BOOTUP_TIMEOUT_SECS);
    }
  }
}
