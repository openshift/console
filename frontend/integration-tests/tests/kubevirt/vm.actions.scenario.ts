/* eslint-disable no-undef */
import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';

import { appHost, testName } from '../../protractor.conf';
import { filterForName, isLoaded, resourceRowsPresent } from '../../views/crud.view';
import { detailViewAction, listViewAction, detailViewVmStatus, detailViewVmIcon, listViewVmStatus, listViewVmIcon,
  runningIcon, pendingIcon, statusIcon, offIcon } from '../../views/kubevirt/vm.actions.view';
import { testVM, testNAD, hddDisk, networkInterface } from './mocks';
import { yamlTab, overviewTab, disksTab, nicsTab } from '../../views/kubevirt/virtualMachine.view';
import { removeLeakedResources, VM_BOOTUP_TIMEOUT, VM_STOP_TIMEOUT, VM_ACTIONS_TIMEOUT } from './utils';
import { VirtualMachine } from './models/virtualMachine';


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
      await browser.wait(until.presenceOf(detailViewVmIcon(offIcon)), VM_STOP_TIMEOUT);
    });

    it('Deletes VM', async() => {
      await detailViewAction('Delete');
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });
  });
});

describe('Add/remove disks and NICs on respective VM pages', () => {
  const vmName = `vm-disk-nic-${testName}`;
  const vm = new VirtualMachine(vmName, testName);

  beforeAll(async() => {
    testVM.metadata.name = vmName;
    execSync(`echo '${JSON.stringify(testNAD)}' | kubectl create -f -`);
    execSync(`echo '${JSON.stringify(testVM)}' | kubectl create -f -`);
    await vm.action('Start');
  });

  afterAll(async() => {
    execSync(`echo '${JSON.stringify(testVM)}' | kubectl delete -f -`);
    execSync(`echo '${JSON.stringify(testNAD)}' | kubectl delete -f -`);
  });

  it('Add/remove disk on VM disks page', async() => {
    await vm.addDisk(hddDisk.name, hddDisk.size, hddDisk.StorageClass);
    expect((await vm.getAttachedResources(disksTab)).includes(hddDisk.name)).toBe(true);

    let vmi = await vm.navigateToVmi(overviewTab);
    expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(false);

    await vm.action('Restart');

    vmi = await vm.navigateToVmi(overviewTab);
    expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(true);

    await vm.removeDisk(hddDisk.name);
    expect((await vm.getAttachedResources(disksTab)).includes(hddDisk.name)).toBe(false);

    await vm.action('Restart');

    vmi = await vm.navigateToVmi(overviewTab);
    expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(false);
  }, VM_ACTIONS_TIMEOUT * 2);

  it('Add/remove nic on VM Network Interfaces page', async() => {
    await vm.addNic(networkInterface.name, networkInterface.mac, networkInterface.networkDefinition);

    expect((await vm.getAttachedResources(nicsTab)).includes(networkInterface.name)).toBe(true);
    let vmi = await vm.navigateToVmi(yamlTab);
    expect((await vmi.searchYAML(networkInterface.networkDefinition))).toBe(false);

    await vm.action('Restart');

    vmi = await vm.navigateToVmi(yamlTab);
    expect((await vmi.searchYAML(networkInterface.networkDefinition))).toBe(true);

    await vm.removeNic(networkInterface.name);
    expect((await vm.getAttachedResources(nicsTab)).includes(networkInterface.name)).toBe(false);

    await vm.action('Restart');

    vmi = await vm.navigateToVmi(yamlTab);
    expect((await vmi.searchYAML(networkInterface.networkDefinition))).toBe(false);
  }, VM_ACTIONS_TIMEOUT * 2);
});
