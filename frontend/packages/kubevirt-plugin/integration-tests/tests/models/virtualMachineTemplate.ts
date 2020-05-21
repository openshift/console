/* eslint-disable no-await-in-loop */
import { click } from '@console/shared/src/test-utils/utils';
import { detailViewAction, listViewAction } from '@console/shared/src/test-utils/actions.view';
import { VirtualMachineTemplateModel } from '../utils/types';
import { getResourceUID } from '../utils/utils';
import { KubevirtUIResource } from './kubevirtUIResource';
import { VMT_ACTION } from '../utils/consts';
import { templateCreateVMLink } from '../../views/template.view';

const confirmedActions: VMT_ACTION[] = [VMT_ACTION.Delete];

export class VirtualMachineTemplate extends KubevirtUIResource {
  constructor(templateConfig) {
    super({ ...templateConfig, model: VirtualMachineTemplateModel });
  }

  async action(action: VMT_ACTION) {
    await this.navigateToDetail();
    await detailViewAction(action, confirmedActions.includes(action));
  }

  async listViewAction(action: VMT_ACTION) {
    await this.navigateToListView();
    await listViewAction(this.name)(action, confirmedActions.includes(action));
  }

  async createVMFromRowLink() {
    await this.navigateToListView();
    const uid = getResourceUID(this.model.kind, this.name, this.namespace);
    await click(templateCreateVMLink(uid));
  }
}
