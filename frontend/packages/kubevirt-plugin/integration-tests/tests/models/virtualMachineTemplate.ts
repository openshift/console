import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { cloneDeepWithEnum } from '@console/shared/src/constants/object-enum';
import { detailViewAction, listViewAction } from '@console/shared/src/test-utils/actions.view';
/* eslint-disable no-await-in-loop */
import { click } from '@console/shared/src/test-utils/utils';
import { templateCreateVMLink, vmtLinkByName, vmtTitle } from '../../views/template.view';
import { VirtualMachineTemplateModel } from '../types/types';
import { VMTemplateBuilderData } from '../types/vm';
import { VMT_ACTION } from '../utils/constants/vm';
import { getResourceUID } from '../utils/utils';
import { KubevirtUIResource } from './kubevirtUIResource';
import { Wizard } from './wizard';

const confirmedActions: VMT_ACTION[] = [VMT_ACTION.Delete];

export class VirtualMachineTemplate extends KubevirtUIResource<VMTemplateBuilderData> {
  constructor(data: VMTemplateBuilderData) {
    super(data, VirtualMachineTemplateModel);
  }

  public getData(): VMTemplateBuilderData {
    return cloneDeepWithEnum(this.data);
  }

  async action(action: VMT_ACTION) {
    await this.navigateToListView();
    await click(vmtLinkByName(this.name));
    await detailViewAction(action, confirmedActions.includes(action));
  }

  async listViewAction(action: VMT_ACTION) {
    await this.navigateToListView();
    await listViewAction(this.name)(action, confirmedActions.includes(action));
  }

  async getResourceName(): Promise<string> {
    await this.navigateToListView();
    await click(vmtLinkByName(this.name));
    await isLoaded();
    return this.getResourceTitle();
  }

  async navigateToVMTDetails() {
    const templateName = await this.getResourceName();
    await click(vmtTitle(templateName));
  }

  async createVMFromRowLink() {
    await this.navigateToListView();
    const templateName = await this.getResourceName();
    const uid = getResourceUID(this.model.kind, templateName, this.namespace);
    await click(templateCreateVMLink(uid));
  }

  async create() {
    const wizard = new Wizard();
    await this.navigateToListView();
    await wizard.openWizard(VirtualMachineTemplateModel);
    await wizard.processGeneralStep(this.data);
    await wizard.processNetworkStep(this.data);
    await wizard.processStorageStep(this.data);
    await wizard.processAdvanceStep(this.data);
    await wizard.confirmAndCreate();
    await wizard.waitForCreation();
  }
}
