import { $, browser, ExpectedConditions as until } from 'protractor';

import { createItemButton, isLoaded } from '../../../views/crud.view';
import { fillInput, selectDropdownOption, click } from '../utils/utils';
import { cloudInitConfig, storageResource } from '../utils/types';
import { PAGE_LOAD_TIMEOUT } from '../utils/consts';
import * as wizardView from '../../../views/kubevirt/wizard.view';


export default class Wizard {
  async openWizard() {
    await click(createItemButton);
    await click(wizardView.createWithWizardLink);
    await browser.wait(until.presenceOf(wizardView.nameInput), PAGE_LOAD_TIMEOUT);
  }

  async close() {
    await click(wizardView.closeWizard, PAGE_LOAD_TIMEOUT);
    await browser.wait(until.invisibilityOf(wizardView.wizardHeader), PAGE_LOAD_TIMEOUT);
    // Clone VM dialog uses fade in/fade out effect, wait until it disappears
    await browser.wait(until.invisibilityOf($('div.fade')));
  }

  async fillName(name: string) {
    await fillInput(wizardView.nameInput, name);
  }

  async fillDescription(description: string) {
    await fillInput(wizardView.descriptionInput, description);
  }

  async selectNamespace(namespace: string) {
    await selectDropdownOption(wizardView.namespaceDropdownId, namespace);
  }

  async selectTemplate(template: string) {
    await selectDropdownOption(wizardView.templateDropdownId, template);
  }

  async selectOperatingSystem(operatingSystem: string) {
    await selectDropdownOption(wizardView.operatingSystemDropdownId, operatingSystem);
  }

  async selectFlavor(flavor: string) {
    await selectDropdownOption(wizardView.flavorDropdownId, flavor);
  }

  async selectWorkloadProfile(workloadProfile: string) {
    await selectDropdownOption(wizardView.workloadProfileDropdownId, workloadProfile);
  }

  async selectProvisionSource(provisionOptions) {
    await selectDropdownOption(wizardView.provisionSourceDropdownId, provisionOptions.method);
    if (provisionOptions.hasOwnProperty('source')) {
      await fillInput(wizardView.provisionSources[provisionOptions.method], provisionOptions.source);
    }
  }

  async startOnCreation() {
    await click(wizardView.startVMOnCreation);
  }

  async useCloudInit(cloudInitOptions: cloudInitConfig) {
    await click(wizardView.useCloudInit);
    if (cloudInitOptions.useCustomScript) {
      await click(wizardView.useCustomScript);
      await fillInput(wizardView.customCloudInitScript, cloudInitOptions.customScript);
    } else {
      await fillInput(wizardView.cloudInitHostname, cloudInitOptions.hostname);
      await fillInput(wizardView.cloudInitSSH, cloudInitOptions.sshKey);
    }
  }

  async next() {
    await isLoaded();
    await click(wizardView.nextButton);
    await isLoaded();
  }

  async addNic(name: string, mac: string, networkDefinition: string, binding: string) {
    await click(wizardView.createNIC);
    const rowsCount = await this.getTableRowsCount();
    // Dropdown selection needs to be first due to https://github.com/kubevirt/web-ui-components/issues/9
    await wizardView.selectTableDropdownAttribute(rowsCount, 'network', networkDefinition);
    await wizardView.selectTableDropdownAttribute(rowsCount, 'binding', binding),
    await wizardView.setTableInputAttribute(rowsCount, 'name', name);
    await wizardView.setTableInputAttribute(rowsCount, 'mac', mac);
    await click(wizardView.apply);
  }

  async selectPxeNIC(networkDefinition: string) {
    await selectDropdownOption(wizardView.pxeNICDropdownId, networkDefinition);
  }

  async getTableRowsCount() {
    return await wizardView.tableRowsCount();
  }

  async addDisk(disk: storageResource) {
    await click(wizardView.createDisk);
    const rowsCount = await this.getTableRowsCount();
    // Dropdown selection needs to be first due to https://github.com/kubevirt/web-ui-components/issues/9
    await wizardView.selectTableDropdownAttribute(rowsCount, 'storage', disk.storageClass);
    await wizardView.setTableInputAttribute(rowsCount, 'name', disk.name);
    await wizardView.setTableInputAttribute(rowsCount, 'size', disk.size);
    await click(wizardView.apply);
  }

  async attachDisk(disk: storageResource) {
    await click(wizardView.attachDisk);
    const rowsCount = await this.getTableRowsCount();
    await wizardView.selectTableDropdownAttribute(rowsCount, 'name-attach', disk.name);
    await click(wizardView.apply);
  }

  async editDiskAttribute(rowNumber: number, attribute: string, value: string) {
    await wizardView.activateTableRow(rowNumber - 1);
    if (attribute === 'storage') {
      await wizardView.selectTableDropdownAttribute(rowNumber, attribute, value);
    } else {
      await wizardView.setTableInputAttribute(rowNumber, attribute, value);
    }
    await click(wizardView.apply);
  }

  async waitForCreation() {
    await browser.wait(until.presenceOf(wizardView.provisionResultIcon));
    await browser.wait(until.elementToBeClickable(wizardView.nextButton), PAGE_LOAD_TIMEOUT);
  }
}
