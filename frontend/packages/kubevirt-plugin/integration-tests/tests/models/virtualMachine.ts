/* eslint-disable no-await-in-loop, no-console */
import { browser, ExpectedConditions as until } from 'protractor';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { modalOverlay } from '@console/kubevirt-plugin/integration-tests/views/uiResource.view';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { MatchLabels } from 'public/module/k8s';
import { cloneDeepWithEnum } from '../../../src/constants/object-enum';
import { click, waitForStringNotInElement } from '../../utils/shared-utils';
import { detailViewAction, listViewAction } from '../../views/actions.view';
import { saveButton } from '../../views/kubevirtUIResource.view';
import { vmtLinkByName } from '../../views/template.view';
import { resourceHorizontalTab } from '../../views/uiResource.view';
import * as vmView from '../../views/virtualMachine.view';
import { CloneVirtualMachineDialog } from '../dialogs/cloneVirtualMachineDialog';
import { AddDialog } from '../dialogs/schedulingDialog';
import { VirtualMachineTemplateModel } from '../types/types';
import { VMBuilderData } from '../types/vm';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  UNEXPECTED_ACTION_ERROR,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
} from '../utils/constants/common';
import { TAB, VM_ACTION, VM_STATUS } from '../utils/constants/vm';
import { getRandStr } from '../utils/utils';
import { BaseVirtualMachine } from './baseVirtualMachine';
import { Wizard } from './wizard';

const noConfirmDialogActions: VM_ACTION[] = [VM_ACTION.Start, VM_ACTION.Clone];

export class VirtualMachine extends BaseVirtualMachine {
  constructor(data: VMBuilderData) {
    super(data, VirtualMachineModel);
  }

  getData(): VMBuilderData {
    return cloneDeepWithEnum(this.data);
  }

  /**
   * Performs action form list view or detail view
   */
  async action(action: VM_ACTION, waitForAction = true, timeout?: number) {
    if (await this.isOnListView()) {
      await this.listViewAction(action, waitForAction, timeout);
    } else if (await this.isOnDetailView()) {
      await this.detailViewAction(action, waitForAction, timeout);
    } else {
      await this.navigateToListView();
      await this.listViewAction(action, waitForAction, timeout);
    }
  }

  async detailViewAction(action: VM_ACTION, waitForAction = true, timeout?: number) {
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
    await browser.refresh();
    await browser.wait(
      waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), fromNode),
      timeout,
    );
  }

  async nodeSelectorsAction(action: string, labels: MatchLabels) {
    const dialog = new AddDialog();
    await this.navigateToDetail();
    await this.modalEditNodeSelector();
    switch (action) {
      case 'add':
        await dialog.addLabels('label', 'key', labels);
        break;
      case 'delete':
        await dialog.deleteLabels('label', 'key', labels);
        break;
      default:
        throw Error(UNEXPECTED_ACTION_ERROR);
    }
    await click(saveButton);
    await browser.wait(until.invisibilityOf(modalOverlay), PAGE_LOAD_TIMEOUT_SECS);
  }

  async tolerationsAction(action: string, labels: MatchLabels) {
    const dialog = new AddDialog();
    await this.navigateToDetail();
    await this.modalEditTolerations();
    switch (action) {
      case 'add':
        await dialog.addLabels('toleration', 'taint key', labels);
        break;
      case 'delete':
        await dialog.deleteLabels('toleration', 'taint key', labels);
        break;
      default:
        throw Error(UNEXPECTED_ACTION_ERROR);
    }
    await click(saveButton);
    await browser.wait(until.invisibilityOf(modalOverlay), PAGE_LOAD_TIMEOUT_SECS);
  }

  async start(waitForAction = true) {
    await this.action(VM_ACTION.Start, waitForAction);
  }

  async restart(waitForAction = true) {
    await this.action(VM_ACTION.Restart, waitForAction);
  }

  async stop(waitForAction = true) {
    await this.action(VM_ACTION.Stop, waitForAction);
  }

  async migrate(waitForAction = true) {
    await this.action(VM_ACTION.Migrate, waitForAction);
  }

  async delete(waitForAction = true) {
    await this.action(VM_ACTION.Delete, waitForAction);
  }

  async clone(name?: string, namespace?: string): Promise<VirtualMachine> {
    const cloneDialog = new CloneVirtualMachineDialog();
    const builderData: VMBuilderData = this.getData();

    if (name) {
      builderData.name = name;
    } else {
      builderData.name = `${this.name}-clone-${getRandStr(5)}`;
    }
    if (namespace) {
      builderData.namespace = namespace;
    }

    await this.action(VM_ACTION.Clone, true);
    await cloneDialog.fillName(builderData.name);
    await cloneDialog.selectNamespace(builderData.namespace);
    if (builderData.startOnCreation) {
      await cloneDialog.startOnCreation();
    }
    await cloneDialog.clone();
    return new VirtualMachine(builderData);
  }

  async getVmtResourceName(vmtName: string): Promise<string> {
    await this.navigateToListView();
    await click(resourceHorizontalTab(VirtualMachineTemplateModel));
    await click(vmtLinkByName(vmtName));
    await isLoaded();
    return this.getResourceTitle();
  }

  async create() {
    const wizard = new Wizard();
    const { template, templateNamespace } = this.getData();

    await this.navigateToListView();

    if (template) {
      const templateSourceName = await this.getVmtResourceName(template);
      await this.navigateToListView();
      await wizard.openVMFromTemplateWizard(templateSourceName, templateNamespace);
    } else {
      await wizard.openWizard(VirtualMachineModel);
    }

    await wizard.processWizard(this.data);

    await this.navigateToDetail();
    if (this.data.waitForDiskImport) {
      await browser.wait(
        waitForStringNotInElement(
          vmView.vmDetailStatus(this.namespace, this.name),
          VM_STATUS.Importing,
        ),
        VM_BOOTUP_TIMEOUT_SECS,
      );
    }
    if (this.data.startOnCreation) {
      await this.waitForStatus(VM_STATUS.Running, VM_BOOTUP_TIMEOUT_SECS);
    }
  }
}
