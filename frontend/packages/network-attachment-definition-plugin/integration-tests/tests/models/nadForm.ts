import { browser, ExpectedConditions as until } from 'protractor';
import { BROWSER_TIMEOUT, testName } from '@console/internal-integration-tests/protractor.conf';
import { createYAMLButton, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { PAGE_LOAD_TIMEOUT_SECS } from '@console/kubevirt-plugin/integration-tests/tests/utils/constants/common';
import { click, selectDropdownOptionById } from '@console/shared/src/test-utils/utils';
import * as nadFormView from '../../views/nad.form.view';

// TODO See about moving this function from kubevirt-plugin to console-shared
async function fillInput(elem: any, value: string) {
  // Sometimes there seems to be an issue with clear() method not clearing the input
  let attempts = 3;

  /* eslint-disable no-await-in-loop */
  do {
    --attempts;
    if (attempts < 0) {
      throw Error(`Failed to fill input with value: '${value}'.`);
    }
    await browser.wait(until.and(until.presenceOf(elem), until.elementToBeClickable(elem)));
    // TODO: line below can be removed when pf4 tables in use.
    await elem.click();
    await elem.clear();
    await elem.sendKeys(value);
  } while ((await elem.getAttribute('value')) !== value && attempts > 0);
  /* eslint-enable no-await-in-loop */
}

export class NADForm {
  async openNADForm() {
    await click(createYAMLButton);
    await browser.wait(until.presenceOf(nadFormView.nameInput), PAGE_LOAD_TIMEOUT_SECS);
  }

  async closeNADForm() {
    await click(nadFormView.closeForm, PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.invisibilityOf(nadFormView.formHeader), PAGE_LOAD_TIMEOUT_SECS);
  }

  async fillName(name: string) {
    await fillInput(nadFormView.nameInput, name);
  }

  async fillDescription(description: string) {
    await fillInput(nadFormView.descriptionInput, description);
  }

  async selectNetworkTypeByID(networkTypeID: string) {
    await selectDropdownOptionById(nadFormView.networkTypeDropdownId, networkTypeID);
  }

  async fillBridgeName(bridgeName: string) {
    await fillInput(nadFormView.bridgeNameInput, bridgeName);
  }

  async fillVLANTagNumInput(vlanTagNum: string) {
    await fillInput(nadFormView.vlanTagNumInput, vlanTagNum);
  }

  async create() {
    await click(nadFormView.createBtn);
    await isLoaded();
  }

  async waitForCreation() {
    await browser.wait(until.urlContains(`/${testName}`), BROWSER_TIMEOUT);
  }
}
