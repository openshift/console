/* eslint-disable no-unused-vars, no-undef */
import { $, browser, ExpectedConditions as until } from 'protractor';

import { createItemButton, isLoaded} from '../../../views/crud.view';
import { fillInput, PAGE_LOAD_TIMEOUT, selectDropdownOption, tickCheckbox } from '../utils';
import * as wizardView from '../../../views/kubevirt/wizard.view';

export default class Wizard {
  async openWizard() {
    await createItemButton.click().then(() => wizardView.createWithWizardLink.click());
    await browser.wait(until.presenceOf(wizardView.nameInput), PAGE_LOAD_TIMEOUT);
  }

  async close() {
    await browser.wait(until.elementToBeClickable(wizardView.closeWizard), PAGE_LOAD_TIMEOUT).then(() => wizardView.closeWizard.click());
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
    await browser.wait(until.elementToBeClickable(wizardView.startVMOnCreation))
      .then(async() => await tickCheckbox(wizardView.startVMOnCreation));
  }

  async useCloudInit(cloudInitOptions) {
    await tickCheckbox(wizardView.useCloudInit);
    if (cloudInitOptions.useCustomScript) {
      await tickCheckbox(wizardView.useCustomScript);
      await fillInput(wizardView.customCloudInitScript, cloudInitOptions.customScript);
    } else {
      await fillInput(wizardView.cloudInitHostname, cloudInitOptions.hostname);
      await fillInput(wizardView.cloudInitSSH, cloudInitOptions.ssh);
    }
  }

  async next() {
    await isLoaded();
    await browser.wait(until.elementToBeClickable(wizardView.nextButton))
      .then(async() => await wizardView.nextButton.click());
    await isLoaded();
  }

  async addNic(name: string, mac: string, networkDefinition: string, binding: string) {
    await wizardView.createNIC.click();
    const rowsCount = await this.getTableRowsCount();
    // Dropdown selection needs to be first due to https://github.com/kubevirt/web-ui-components/issues/9
    await wizardView.selectTableDropdownAttribute(rowsCount, 'network', networkDefinition);
    await wizardView.selectTableDropdownAttribute(rowsCount, 'binding', binding),
    await wizardView.setTableInputAttribute(rowsCount, 'name', name);
    await wizardView.setTableInputAttribute(rowsCount, 'mac', mac);
    await wizardView.apply.click();
  }

  async selectPxeNIC(networkDefinition: string) {
    await selectDropdownOption(wizardView.pxeNICDropdownId, networkDefinition);
  }

  async getTableRowsCount() {
    return await wizardView.tableRowsCount();
  }

  async addDisk(name: string, size: string, storageClass: string) {
    await wizardView.createDisk.click();
    const rowsCount = await this.getTableRowsCount();
    // Dropdown selection needs to be first due to https://github.com/kubevirt/web-ui-components/issues/9
    await wizardView.selectTableDropdownAttribute(rowsCount, 'storage', storageClass);
    await wizardView.setTableInputAttribute(rowsCount, 'name', name);
    await wizardView.setTableInputAttribute(rowsCount, 'size', size);
    await wizardView.apply.click();
  }

  async editDiskAttribute(rowNumber: number, attribute: string, value: string) {
    await wizardView.activateTableRow(rowNumber - 1);
    if (attribute === 'storage') {
      await wizardView.selectTableDropdownAttribute(rowNumber, attribute, value);
    } else {
      await wizardView.setTableInputAttribute(rowNumber, attribute, value);
    }
    await wizardView.apply.click();
  }

  async waitForCreation() {
    await browser.wait(until.presenceOf(wizardView.provisionResultIcon));
    await browser.wait(until.elementToBeClickable(wizardView.nextButton), PAGE_LOAD_TIMEOUT);
  }
}
