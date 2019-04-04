/* eslint-disable no-unused-vars, no-undef */
import { browser, ExpectedConditions as until } from 'protractor';

import { createItemButton, errorMessage } from '../../../views/crud.view';
import * as yamlView from '../../../views/yaml.view';
import { createWithYAMLLink } from '../../../views/kubevirt/wizard.view';

export default class Yaml {
  async openYamlPage() {
    await createItemButton.click();
    await createWithYAMLLink.click();
    await yamlView.isLoaded();
  }

  async createVMFromYaml() {
    await yamlView.saveButton.click();
  }

  async cancelCreateVM() {
    await yamlView.cancelButton.click();
  }
  async errorOccurOnCreateVM() {
    await browser.wait(until.presenceOf(errorMessage));
  }
}
