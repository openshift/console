/* eslint-disable no-await-in-loop, no-console */
import { detailViewAction, listViewAction } from '@console/shared/src/test-utils/actions.view';
import { TAB, VMI_ACTION } from '../utils/constants/vm';
import { VirtualMachineInstanceModel } from '../../../src/models/index';
import { BaseVirtualMachine } from './baseVirtualMachine';
import { VMBuilderData } from '../types/vm';

const noConfirmDialogActions: VMI_ACTION[] = [];

export class VirtualMachineInstance extends BaseVirtualMachine {
  constructor(data: VMBuilderData) {
    super(data, VirtualMachineInstanceModel);
  }

  async action(action: VMI_ACTION, waitForAction = true, timeout?: number) {
    await this.navigateToTab(TAB.Details);

    await detailViewAction(action, !noConfirmDialogActions.includes(action));
    if (waitForAction) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async listViewAction(action: VMI_ACTION, waitForAction = true, timeout?: number) {
    await this.navigateToListView();
    await listViewAction(this.name)(action, !noConfirmDialogActions.includes(action));
    if (waitForAction) {
      await this.waitForActionFinished(action, timeout);
    }
  }
}
