/* eslint-disable no-await-in-loop, no-console */
import { browser } from 'protractor';
import { waitForStringNotInElement } from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import * as vmView from '../../views/virtualMachine.view';
import { VM_MIGRATION_TIMEOUT_SECS, VM_ACTION, TAB, VM_STATUS } from '../utils/consts';
import { detailViewAction, listViewAction } from '../../views/vm.actions.view';
import { BaseVirtualMachine } from './baseVirtualMachine';

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
}
