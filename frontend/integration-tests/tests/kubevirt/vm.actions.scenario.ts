/* eslint-disable no-undef */
import { execSync } from 'child_process';
import { $$, browser, ExpectedConditions as until } from 'protractor';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded, resourceRowsPresent, textFilter } from '../../views/crud.view';
import { listViewAction, getDetailActionDropdownOptions } from '../../views/kubevirt/vm.actions.view';
import { testNad, hddDisk, networkInterface, getVmManifest } from './mocks';
import { removeLeakedResources, deleteResources, createResources, fillInput, searchYAML, waitForCount } from './utils/utils';
import { VM_BOOTUP_TIMEOUT, VM_STOP_TIMEOUT, VM_ACTIONS_TIMEOUT, PAGE_LOAD_TIMEOUT } from './utils/consts';
import { overviewTab, disksTab, nicsTab, statusIcon, statusIcons, vmDetailNode } from '../../views/kubevirt/virtualMachine.view';
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
      createResources([testVm]);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));

      await vm.navigateToTab(overviewTab);
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

describe('Test VM Migration', () => {
  const testVm = getVmManifest('Container', testName);
  const vm = new VirtualMachine(testVm.metadata.name, testVm.metadata.namespace);

  const MIGRATE_VM = 'Migrate Virtual Machine';
  const CANCEL_MIGRATION = 'Cancel Virtual Machine Migration';

  beforeEach(() => {
    createResources([testVm]);
  });

  afterEach(() => {
    deleteResources([testVm]);
  });

  it('Migrate VM action button is displayed appropriately', async() => {
    await vm.navigateToTab(overviewTab);
    expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
    expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

    await vm.action('Start');
    expect(await getDetailActionDropdownOptions()).toContain(MIGRATE_VM);
    expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

    await vm.action('Migrate');
    expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
    expect(await getDetailActionDropdownOptions()).toContain(CANCEL_MIGRATION);
  }, VM_BOOTUP_TIMEOUT);

  it('Migrate VM', async() => {
    await vm.action('Start');
    const sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

    await vm.action('Migrate');
    expect((await vmDetailNode(vm.namespace, vm.name).getText())).not.toBe(sourceNode);
  }, VM_ACTIONS_TIMEOUT);

  it('Migrate already migrated VM', async() => {
    await vm.action('Start');
    const sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

    await vm.action('Migrate');
    expect((await vmDetailNode(vm.namespace, vm.name).getText())).not.toBe(sourceNode);

    await vm.action('Migrate');
    expect((await vmDetailNode(vm.namespace, vm.name).getText())).toBe(sourceNode);
  }, VM_ACTIONS_TIMEOUT);

  it('Cancel ongoing VM migration', async() => {
    await vm.action('Start');
    const sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

    // Start migration without waiting for it to finish
    await vm.action('Migrate', false);
    await vm.waitForStatusIcon(statusIcons.migrating, PAGE_LOAD_TIMEOUT);

    await vm.action('Cancel');
    expect((await vmDetailNode(vm.namespace, vm.name).getText())).toBe(sourceNode);
  }, VM_BOOTUP_TIMEOUT);
});

describe('Add/remove disks and NICs on respective VM pages', () => {
  const testVm = getVmManifest('Container', testName);
  const vmName = `vm-disk-nic-${testName}`;
  const vm = new VirtualMachine(vmName, testName);

  beforeAll(async() => {
    testVm.metadata.name = vmName;
    createResources([testNad, testVm]);
    await vm.action('Start');
  });

  afterAll(async() => {
    deleteResources([testNad, testVm]);
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
    await vm.addNic(networkInterface.name, networkInterface.mac, networkInterface.networkDefinition, networkInterface.binding);

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
