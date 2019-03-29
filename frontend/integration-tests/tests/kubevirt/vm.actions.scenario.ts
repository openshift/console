/* eslint-disable no-undef */
import { execSync } from 'child_process';
import { $$, browser, ExpectedConditions as until } from 'protractor';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded, resourceRowsPresent, textFilter } from '../../views/crud.view';
import { listViewAction } from '../../views/kubevirt/vm.actions.view';
import { testNad, hddDisk, networkInterface, getVmManifest } from './mocks';
import { overviewTab, disksTab, nicsTab, statusIcon, statusIcons } from '../../views/kubevirt/virtualMachine.view';
import { removeLeakedResources, fillInput, searchYAML, waitForCount, VM_BOOTUP_TIMEOUT, VM_STOP_TIMEOUT, VM_ACTIONS_TIMEOUT, PAGE_LOAD_TIMEOUT } from './utils';
import { VirtualMachine } from './models/virtualMachine';


describe('Test VM actions', () => {
  const leakedResources = new Set<string>();
  const testVm = getVmManifest('Container', testName);

  afterAll(async() => {
    removeLeakedResources(leakedResources);
  });

  describe('Test VM list view kebab actions', () => {
    const vmName = `vm-list-view-actions-${testName}`;

    beforeAll(async() => {
      testVm.metadata.name = vmName;
      execSync(`echo '${JSON.stringify(testVm)}' | kubectl create -f -`);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));

      // Navigate to Virtual Machines page
      await browser.get(`${appHost}/k8s/all-namespaces/virtualmachines`);
      await isLoaded();
      await fillInput(textFilter, vmName);
      await resourceRowsPresent();
    });

    // Workaround for https://github.com/kubevirt/web-ui/issues/177, remove when resolved
    afterEach(async() => await browser.sleep(1000));

    it('Starts VM', async() => {
      await listViewAction(vmName)('Start');
      await fillInput(textFilter, vmName);
      await browser.wait(until.presenceOf(statusIcon(statusIcons.running)), VM_BOOTUP_TIMEOUT);
    }, VM_BOOTUP_TIMEOUT);

    it('Restarts VM', async() => {
      await listViewAction(vmName)('Restart');
      await fillInput(textFilter, vmName);
      await browser.wait(until.presenceOf(statusIcon(statusIcons.starting)), VM_BOOTUP_TIMEOUT);
      await browser.wait(until.presenceOf(statusIcon(statusIcons.running)), VM_BOOTUP_TIMEOUT);
    }, VM_ACTIONS_TIMEOUT);

    it('Stops VM', async() => {
      await listViewAction(vmName)('Stop');
      await fillInput(textFilter, vmName);
      await browser.wait(until.presenceOf(statusIcon(statusIcons.off)), VM_STOP_TIMEOUT);
    });

    it('Deletes VM', async() => {
      await listViewAction(vmName)('Delete');
      await isLoaded();
      await fillInput(textFilter, vmName);
      await browser.wait(until.and(waitForCount($$('.co-resource-list__item'), 0)), PAGE_LOAD_TIMEOUT);
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });
  });

  describe('Test VM detail view kebab actions', () => {
    const vmName = `vm-detail-view-actions-${testName}`;
    const vm = new VirtualMachine(vmName, testName);

    beforeAll(async() => {
      testVm.metadata.name = vmName;
      execSync(`echo '${JSON.stringify(testVm)}' | kubectl create -f -`);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });

    it('Navigates to VMs detail page', async() => {
      await browser.get(`${appHost}/k8s/all-namespaces/virtualmachines/${vmName}`);
      await isLoaded();
    });

    it('Starts VM', async() => {
      await vm.action('Start');
    }, VM_BOOTUP_TIMEOUT);

    it('Restarts VM', async() => {
      await vm.action('Restart');
    }, VM_ACTIONS_TIMEOUT);

    it('Stops VM', async() => {
      await vm.action('Stop');
    });

    it('Deletes VM', async() => {
      await vm.action('Delete');
      await isLoaded();
      await fillInput(textFilter, vmName);
      await browser.wait(until.and(waitForCount($$('.co-resource-list__item'), 0)), PAGE_LOAD_TIMEOUT);
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });
  });
});

describe('Add/remove disks and NICs on respective VM pages', () => {
  const testVm = getVmManifest('Container', testName);
  const vmName = `vm-disk-nic-${testName}`;
  const vm = new VirtualMachine(vmName, testName);

  beforeAll(async() => {
    testVm.metadata.name = vmName;
    execSync(`echo '${JSON.stringify(testNad)}' | kubectl create -f -`);
    execSync(`echo '${JSON.stringify(testVm)}' | kubectl create -f -`);
    await vm.action('Start');
  });

  afterAll(async() => {
    execSync(`echo '${JSON.stringify(testVm)}' | kubectl delete -f -`);
    execSync(`echo '${JSON.stringify(testNad)}' | kubectl delete -f -`);
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
    expect((searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi'))).toBe(false);

    await vm.action('Restart');

    expect((searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi'))).toBe(true);

    await vm.removeNic(networkInterface.name);
    expect((await vm.getAttachedResources(nicsTab)).includes(networkInterface.name)).toBe(false);

    await vm.action('Restart');

    expect((searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi'))).toBe(false);
  }, VM_ACTIONS_TIMEOUT * 2);
});
