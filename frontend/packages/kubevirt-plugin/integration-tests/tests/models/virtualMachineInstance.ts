import { VirtualMachineInstanceModel } from '../../../src/models/index';
/* eslint-disable no-await-in-loop, no-console */
import { detailViewAction, listViewAction } from '../../views/actions.view';
import { VMBuilderData } from '../types/vm';
import { TAB, VMI_ACTION } from '../utils/constants/vm';
import { BaseVirtualMachine } from './baseVirtualMachine';

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
