/* eslint-disable no-await-in-loop, no-console */
import { browser, ExpectedConditions as until } from 'protractor';
import {
  waitForStringNotInElement,
  click,
  asyncForEach,
} from '@console/shared/src/test-utils/utils';
import { detailViewAction, listViewAction } from '@console/shared/src/test-utils/actions.view';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import * as vmView from '../../views/virtualMachine.view';
import {
  VM_MIGRATION_TIMEOUT_SECS,
  VM_ACTION,
  TAB,
  VM_STATUS,
  PAGE_LOAD_TIMEOUT_SECS,
} from '../utils/consts';
import { BaseVirtualMachine } from './baseVirtualMachine';
import { NodeSelectorDialog } from '../dialogs/nodeSelectorDialog';
import { saveButton } from '../../views/kubevirtUIResource.view';
import { annotationDialogOverlay } from '@console/internal-integration-tests/views/modal-annotations.view';
import { MatchLabels } from '@console/internal/module/k8s';

const noConfirmDialogActions: VM_ACTION[] = [VM_ACTION.Start, VM_ACTION.Clone];

export class VirtualMachine extends BaseVirtualMachine {
  constructor(config) {
    super({ ...config, model: VirtualMachineModel });
  }

  async action(action: VM_ACTION, waitForAction = true, timeout?: number) {
    await this.navigateToTab(TAB.Details);

    await detailViewAction(action, !noConfirmDialogActions.includes(action));
    if (waitForAction) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async listViewAction(action: VM_ACTION, waitForAction = true, timeout?: number) {
    await this.navigateToListView();

    await listViewAction(this.name)(action, !noConfirmDialogActions.includes(action));
    if (waitForAction) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async waitForMigrationComplete(fromNode: string, timeout: number) {
    await this.waitForStatus(VM_STATUS.Running, VM_MIGRATION_TIMEOUT_SECS);
    await browser.wait(
      waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), fromNode),
      timeout,
    );
  }

  async addNodeSelectors(labels: MatchLabels) {
    const nodeSelectorDialog = new NodeSelectorDialog();
    await this.navigateToDetail();
    await this.modalEditNodeSelector();
    await nodeSelectorDialog.addLabels(labels);
    await click(saveButton);
    await browser.wait(until.invisibilityOf(annotationDialogOverlay), PAGE_LOAD_TIMEOUT_SECS);
  }

  async deleteNodeSelector(key: string) {
    const nodeSelectorDialog = new NodeSelectorDialog();
    await this.navigateToDetail();
    await this.modalEditNodeSelector();
    await nodeSelectorDialog.deleteLabel(key);
    await click(saveButton);
    await browser.wait(until.invisibilityOf(annotationDialogOverlay), PAGE_LOAD_TIMEOUT_SECS);
  }

  async deleteNodeSelectors(keys: string[]) {
    return asyncForEach(keys, async (key: string) => {
      await this.deleteNodeSelector(key);
    });
  }
}
