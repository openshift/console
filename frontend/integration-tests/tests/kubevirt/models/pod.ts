/* eslint-disable no-unused-vars, no-undef */
import { browser, ExpectedConditions as until } from 'protractor';

import * as vmView from '../../../views/kubevirt/virtualMachine.view';
import { DetailView } from './detailView';
import { resourceTitle, resourceRows, filterForName } from '../../../views/crud.view';
import { PAGE_LOAD_TIMEOUT, WAIT_TIMEOUT_ERROR, POD_TERMINATION_TIMEOUT } from '../utils/consts';
import { waitForCount } from '../utils/utils';
import { detailViewAction } from '../../../views/kubevirt/vm.actions.view';
import { statusIcon } from '../../../views/kubevirt/pod.view';

export default class Pod extends DetailView {
  constructor(name: string, namespace: string) {
    super(name, namespace, 'pods');
  }

  async action(action: string) {
    await this.navigateToTab(vmView.overviewTab);
    const confirmDialog = true;

    await detailViewAction(action, confirmDialog);

    switch (action) {
      case 'Delete':
        await browser.wait(until.textToBePresentInElement(resourceTitle, 'Pods'), PAGE_LOAD_TIMEOUT);
        await filterForName(this.name);
        await browser.wait(until.and(waitForCount(resourceRows, 0)), POD_TERMINATION_TIMEOUT);
        break;
      default:
        throw Error('Received unexpected action.');
    }
  }

  async waitForStatusIcon(status: string, timeout: number) {
    await this.navigateToTab(vmView.overviewTab);
    await browser.wait(until.presenceOf(statusIcon(status)), timeout).catch(() => {
      throw new Error(WAIT_TIMEOUT_ERROR);
    });
  }
}
