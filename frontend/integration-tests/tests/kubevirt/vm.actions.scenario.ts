/* eslint-disable no-undef */
import * as _ from 'lodash';
import { execSync } from 'child_process';
import { $, $$, browser, ExpectedConditions as until } from 'protractor';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded, resourceRowsPresent, textFilter } from '../../views/crud.view';
import { listViewAction, getDetailActionDropdownOptions } from '../../views/kubevirt/vm.actions.view';
import { createNic, networkTypeDropdownId } from '../../views/kubevirt/kubevirtDetailView.view';
import { testNad, hddDisk, networkInterface, getVmManifest } from './mocks';
import { click, removeLeakedResources, deleteResources, createResources, fillInput, searchYAML, waitForCount, getResourceObject, getDropdownOptions } from './utils/utils';
import { VM_BOOTUP_TIMEOUT, VM_STOP_TIMEOUT, VM_ACTIONS_TIMEOUT, PAGE_LOAD_TIMEOUT, TABS } from './utils/consts';
import { statusIcon, statusIcons, vmDetailNode } from '../../views/kubevirt/virtualMachine.view';
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

      await vm.navigateToTab(TABS.OVERVIEW);
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
    await vm.navigateToTab(TABS.OVERVIEW);
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
    await vm.addDisk(hddDisk);
    expect((await vm.getAttachedResources(TABS.DISKS)).includes(hddDisk.name)).toBe(true);

    let vmi = await vm.navigateToVmi(TABS.OVERVIEW);
    expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(false);

    await vm.action('Restart');

    vmi = await vm.navigateToVmi(TABS.OVERVIEW);
    expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(true);

    await vm.removeDisk(hddDisk.name);
    expect((await vm.getAttachedResources(TABS.DISKS)).includes(hddDisk.name)).toBe(false);

    await vm.action('Restart');

    vmi = await vm.navigateToVmi(TABS.OVERVIEW);
    expect((await vmi.getVolumes()).includes(hddDisk.name)).toBe(false);
  }, VM_ACTIONS_TIMEOUT * 2);

  it('Add/remove nic on VM Network Interfaces page', async() => {
    await vm.addNic(networkInterface);

    expect((await vm.getAttachedResources(TABS.NICS)).includes(networkInterface.name)).toBe(true);
    expect((searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi'))).toBe(false);

    await vm.action('Restart');

    expect((searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi'))).toBe(true);

    await vm.removeNic(networkInterface.name);
    expect((await vm.getAttachedResources(TABS.NICS)).includes(networkInterface.name)).toBe(false);

    await vm.action('Restart');

    expect((searchYAML(networkInterface.networkDefinition, vm.name, vm.namespace, 'vmi'))).toBe(false);
  }, VM_ACTIONS_TIMEOUT * 2);

  it('NIC cannot be added twice using one net-attach-def', async() => {
    await vm.navigateToTab(TABS.NICS);
    if ((await vm.getAttachedNics()).filter(nic => nic.name === networkInterface.name).length === 0) {
      await vm.addNic(networkInterface);
    }

    // Verify the NIC is added in VM Manifest
    const resource = getResourceObject(vm.name, vm.namespace, vm.kind);
    const nic = _.find(_.get(resource, 'spec.template.spec.domain.devices.interfaces', []), o => o.name === networkInterface.name);
    expect(nic).not.toBe(undefined);

    // Try to add the NIC again
    await click(createNic, 1000, vm.waitForNewResourceRow);

    // The dropdown should be either empty (disabled) or should not contain the already used net-attach-def
    await browser.wait(until.or(
      async() => {
        return !await $(networkTypeDropdownId).isEnabled();
      },
      async() => {
        return !(await getDropdownOptions(networkTypeDropdownId)).includes(networkInterface.networkDefinition);
      }
    ));
  });
});
