/* eslint-disable no-unused-vars, no-undef */
import { browser, ExpectedConditions as until } from 'protractor';

import { createItemButton, errorMessage } from '../../../views/crud.view';
import { createWithYAMLLink } from '../../../views/kubevirt/wizard.view';
import { click } from '../utils/utils';
import * as yamlView from '../../../views/yaml.view';

export default class Yaml {
  async openYamlPage() {
    await click(createItemButton);
    await click(createWithYAMLLink);
    await yamlView.isLoaded();
  }

  async createVMFromYaml() {
    await click(yamlView.saveButton);
  }

  async cancelCreateVM() {
    await click(yamlView.cancelButton);

  }
  async errorOccurOnCreateVM() {
    await browser.wait(until.presenceOf(errorMessage));
  }
}
