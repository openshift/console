/* eslint-disable no-await-in-loop, no-console */
import { browser, ExpectedConditions as until } from 'protractor';
import { cloneDeepCustom } from '@console/shared/src/constants/object-enum';
import {
  waitForStringNotInElement,
  click,
  waitForStringInElement,
} from '@console/shared/src/test-utils/utils';
import { detailViewAction, listViewAction } from '@console/shared/src/test-utils/actions.view';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { annotationDialogOverlay } from '@console/internal-integration-tests/views/modal-annotations.view';
import * as vmView from '../../views/virtualMachine.view';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  UNEXPECTED_ACTION_ERROR,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
} from '../utils/constants/common';
import { BaseVirtualMachine } from './baseVirtualMachine';
import { AddDialog } from '../dialogs/schedulingDialog';
import { saveButton } from '../../views/kubevirtUIResource.view';
import { VMBuilderData } from '../types/vm';
import { VM_ACTION, TAB, VM_STATUS } from '../utils/constants/vm';
import { MatchLabels } from 'public/module/k8s';
import { Wizard } from './wizard';
import { CloneVirtualMachineDialog } from '../dialogs/cloneVirtualMachineDialog';
import { getRandStr } from '../utils/utils';

const noConfirmDialogActions: VM_ACTION[] = [VM_ACTION.Start, VM_ACTION.Clone];

export class VirtualMachine extends BaseVirtualMachine {
  constructor(data: VMBuilderData) {
    super(data, VirtualMachineModel);
  }

  getData(): VMBuilderData {
    return cloneDeepCustom(this.data);
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
    await browser.wait(until.invisibilityOf(annotationDialogOverlay), PAGE_LOAD_TIMEOUT_SECS);
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
    await browser.wait(until.invisibilityOf(annotationDialogOverlay), PAGE_LOAD_TIMEOUT_SECS);
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

  async create() {
    const wizard = new Wizard();
    const { template } = this.getData();

    if (template) {
      await wizard.openVMFromTemplateWizard(template, this.namespace);
    } else {
      await this.navigateToListView();
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
      await browser.wait(
        waitForStringInElement(vmView.vmDetailStatus(this.namespace, this.name), VM_STATUS.Running),
        VM_BOOTUP_TIMEOUT_SECS,
      );
    }
  }
}
