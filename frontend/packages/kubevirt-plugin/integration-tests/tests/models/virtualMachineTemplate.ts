/* eslint-disable no-await-in-loop */
import { click } from '@console/shared/src/test-utils/utils';
import { cloneDeepCustom } from '@console/shared/src/constants/object-enum';
import { detailViewAction, listViewAction } from '@console/shared/src/test-utils/actions.view';
import { VirtualMachineTemplateModel } from '../types/types';
import { getResourceUID } from '../utils/utils';
import { KubevirtUIResource } from './kubevirtUIResource';
import { VMT_ACTION } from '../utils/constants/vm';
import { templateCreateVMLink } from '../../views/template.view';
import { VMTemplateBuilderData } from '../types/vm';
import { Wizard } from './wizard';

const confirmedActions: VMT_ACTION[] = [VMT_ACTION.Delete];

export class VirtualMachineTemplate extends KubevirtUIResource<VMTemplateBuilderData> {
  constructor(data: VMTemplateBuilderData) {
    super(data, VirtualMachineTemplateModel);
  }

  public getData(): VMTemplateBuilderData {
    return cloneDeepCustom(this.data);
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

  async create() {
    const wizard = new Wizard();
    await this.navigateToListView();
    await wizard.openWizard(VirtualMachineTemplateModel);
    await wizard.processWizard(this.data);
    await this.navigateToDetail();
  }
}
