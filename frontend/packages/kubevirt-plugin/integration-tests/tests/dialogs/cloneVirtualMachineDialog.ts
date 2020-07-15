import { browser, ExpectedConditions as until } from 'protractor';
import { click, fillInput } from '@console/shared/src/test-utils/utils';
import { selectOptionByText } from '../utils/utils';
import { PAGE_LOAD_TIMEOUT_SECS, SEC } from '../utils/constants/common';
import * as view from '../../views/dialogs/cloneVirtualMachineDialog.view';

export class CloneVirtualMachineDialog {
  async close() {
    await click(view.cancelButton);
    await browser.wait(until.invisibilityOf(view.modalDialog), PAGE_LOAD_TIMEOUT_SECS);
  }

  async fillName(name: string) {
    await fillInput(view.nameInput, name);
  }

  async fillDescription(description: string) {
    await fillInput(view.descriptionInput, description);
  }

  async selectNamespace(namespace: string) {
    await selectOptionByText(view.namespaceSelector, namespace);
  }

  async startOnCreation() {
    await click(view.startOnCreationCheckBox);
  }

  async clone() {
    try {
      await browser.wait(until.presenceOf(view.errorHelper), 1 * SEC);
    } catch (e) {
      // error wasn't displayed, everything is OK
      await click(view.confirmButton);
      await browser.wait(until.invisibilityOf(view.modalDialog), PAGE_LOAD_TIMEOUT_SECS);
      return;
    }
    // An error is displayed
    throw new Error(await view.errorHelper.getText());
  }
}
