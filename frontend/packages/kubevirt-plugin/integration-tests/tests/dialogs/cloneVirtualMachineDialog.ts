import { browser, ExpectedConditions as until } from 'protractor';
import { click, fillInput } from '@console/shared/src/test-utils/utils';
import { selectOptionByText } from '../utils/utils';
import { PAGE_LOAD_TIMEOUT_SECS } from '../utils/consts';
import * as cloneDialogView from '../../views/dialogs/cloneVirtualMachineDialog.view';

export class CloneVirtualMachineDialog {
  async close() {
    await click(cloneDialogView.cancelButton);
    await browser.wait(until.invisibilityOf(cloneDialogView.modalDialog), PAGE_LOAD_TIMEOUT_SECS);
  }

  async fillName(name: string) {
    await fillInput(cloneDialogView.nameInput, name);
  }

  async fillDescription(description: string) {
    await fillInput(cloneDialogView.descriptionInput, description);
  }

  async selectNamespace(namespace: string) {
    await selectOptionByText(cloneDialogView.namespaceSelector, namespace);
  }

  async startOnCreation() {
    await click(cloneDialogView.startOnCreationCheckBox);
  }

  async clone() {
    await click(cloneDialogView.confirmButton);
    await browser.wait(until.invisibilityOf(cloneDialogView.modalDialog), PAGE_LOAD_TIMEOUT_SECS);
  }
}
