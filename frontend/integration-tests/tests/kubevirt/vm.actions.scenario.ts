/* eslint-disable no-undef */
import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';

import { appHost, testName } from '../../protractor.conf';
import { filterForName, isLoaded, resourceRowsPresent } from '../../views/crud.view';
import { testVM } from './mocks';
import { removeLeakedResources } from './utils';
import { detailViewAction, detailViewVmStatus, listViewAction, listViewVmStatus,
  listViewVmIcon, detailViewVmIcon, runningIcon, offIcon, pendingIcon, statusIcon } from '../../views/kubevirt/vm.actions.view';


const VM_BOOTUP_TIMEOUT = 60000;
const VM_ACTIONS_TIMEOUT = 90000;
const VM_STOP_TIMEOUT = 6000;

describe('Test VM actions', () => {
  const leakedResources = new Set<string>();
  afterAll(async() => {
    removeLeakedResources(leakedResources);
  });

  describe('Test VM list view kebab actions', () => {
    const vmName = `vm-list-view-actions-${testName}`;
    beforeAll(async() => {
      testVM.metadata.name = vmName;
      execSync(`echo '${JSON.stringify(testVM)}' | kubectl create -f -`);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });

    // Workaround for https://github.com/kubevirt/web-ui/issues/177, remove when resolved
    afterEach(async() => await browser.sleep(1000));

    it('Navigates to VMs', async() => {
      await browser.get(`${appHost}/k8s/all-namespaces/virtualmachines`);
      await isLoaded();
      await filterForName(vmName);
      await resourceRowsPresent();
    });

    it('Starts VM', async() => {
      await listViewAction(vmName)('Start');
      await browser.wait(
        until.and(
          until.presenceOf(listViewVmIcon(vmName, runningIcon)),
          until.textToBePresentInElement(listViewVmStatus(vmName), 'Running')
        ), VM_BOOTUP_TIMEOUT);
    });

    it('Restarts VM', async() => {
      await listViewAction(vmName)('Restart');
      await browser.wait(
        until.and(
          until.presenceOf(listViewVmIcon(vmName, pendingIcon)),
          until.textToBePresentInElement(listViewVmStatus(vmName), 'Starting')
        ), VM_BOOTUP_TIMEOUT);
      await browser.wait(until.and(
        until.presenceOf(listViewVmIcon(vmName, runningIcon)),
        until.textToBePresentInElement(listViewVmStatus(vmName), 'Running'))
        , VM_BOOTUP_TIMEOUT);
    }, VM_ACTIONS_TIMEOUT);

    it('Stops VM', async() => {
      await listViewAction(vmName)('Stop');
      await browser.wait(until.presenceOf(listViewVmIcon(vmName, offIcon)), VM_STOP_TIMEOUT);
    });

    it('Deletes VM', async() => {
      await listViewAction(vmName)('Delete');
      await browser.wait(until.not(until.presenceOf(listViewVmIcon(vmName, statusIcon))));
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });
  });

  describe('Test VM detail view kebab actions', () => {
    const vmName = `vm-detail-view-actions-${testName}`;
    beforeAll(async() => {
      testVM.metadata.name = vmName;
      execSync(`echo '${JSON.stringify(testVM)}' | kubectl create -f -`);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });

    it('Navigates to VMs detail page', async() => {
      await browser.get(`${appHost}/k8s/all-namespaces/virtualmachines/${vmName}`);
      await isLoaded();
    });

    it('Starts VM', async() => {
      await detailViewAction('Start');
      await browser.wait(
        until.and(
          until.presenceOf(detailViewVmIcon(runningIcon)),
          until.textToBePresentInElement(detailViewVmStatus, 'Running')
        ), VM_BOOTUP_TIMEOUT);
    });

    it('Restarts VM', async() => {
      await detailViewAction('Restart');
      await browser.wait(
        until.and(
          until.presenceOf(detailViewVmIcon(pendingIcon)),
          until.textToBePresentInElement(detailViewVmStatus, 'Starting')
        ), VM_BOOTUP_TIMEOUT);
      await browser.wait(
        until.and(
          until.presenceOf(detailViewVmIcon(runningIcon)),
          until.textToBePresentInElement(detailViewVmStatus, 'Running')
        ), VM_BOOTUP_TIMEOUT);
    }, VM_ACTIONS_TIMEOUT);

    it('Stops VM', async() => {
      await detailViewAction('Stop');
      await browser.wait(until.and(until.presenceOf(detailViewVmIcon(offIcon))), VM_STOP_TIMEOUT);
    });

    it('Deletes VM', async() => {
      await detailViewAction('Delete');
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });
  });
});
