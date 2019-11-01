/* eslint-disable no-unused-vars, no-undef */
import { browser, ExpectedConditions as until } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';
import { fillInput, selectSelectorOption } from '../utils/utils';
import { PAGE_LOAD_TIMEOUT_SECS } from '../utils/consts';
import * as cloneDialogView from '../../views/cloneDialog.view';

export class CloneDialog {
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
    await selectSelectorOption(cloneDialogView.namespaceSelectorId, namespace);
  }

  async startOnCreation() {
    await click(cloneDialogView.startOnCreationCheckBox);
  }

  async clone() {
    await click(cloneDialogView.confirmButton);
    await browser.wait(until.invisibilityOf(cloneDialogView.modalDialog), PAGE_LOAD_TIMEOUT_SECS);
  }
}
