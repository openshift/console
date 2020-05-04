/* eslint-disable no-await-in-loop, no-console */
import { TAB, VMI_ACTION } from '../utils/consts';
import { detailViewAction, listViewAction } from '../../views/vm.actions.view';
import { VirtualMachineInstanceModel } from '../../../src/models/index';
import { BaseVirtualMachine } from './baseVirtualMachine';

const noConfirmDialogActions: VMI_ACTION[] = [];

export class VirtualMachineInstance extends BaseVirtualMachine {
  constructor(config) {
    super({ ...config, model: VirtualMachineInstanceModel });
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
