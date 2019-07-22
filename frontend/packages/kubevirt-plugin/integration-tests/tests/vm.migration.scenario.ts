import { browser } from 'protractor';
import { testName } from '../../../../integration-tests/protractor.conf';
import { getDetailActionDropdownOptions } from '../views/vm.actions.view';
import {
  statusIcon,
  statusIcons,
  vmDetailNode,
  waitForStatusIcon,
} from '../views/virtualMachine.view';
import {
  createResource,
  deleteResource,
  waitForStringInElement,
} from '../../../console-shared/src/test-utils/utils';
import { getRandStr } from './utils/utils';
import { getVmManifest } from './utils/mocks';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  TABS,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

describe('Test VM Migration', () => {
  const testVm = getVmManifest('Container', testName);
  let vm: VirtualMachine;

  const MIGRATE_VM = 'Migrate Virtual Machine';
  const CANCEL_MIGRATION = 'Cancel Virtual Machine Migration';
  const VM_BOOT_AND_MIGRATE_TIMEOUT = VM_BOOTUP_TIMEOUT_SECS + VM_MIGRATION_TIMEOUT_SECS;

  beforeEach(() => {
    testVm.metadata.name = `migrationvm-${getRandStr(4)}`;
    vm = new VirtualMachine(testVm.metadata);
    createResource(testVm);
  });

  afterEach(() => {
    deleteResource(testVm);
  });

  it(
    'Migrate VM action button is displayed appropriately',
    async () => {
      await vm.navigateToTab(TABS.OVERVIEW);
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.action('Start');
      expect(await getDetailActionDropdownOptions()).toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.action('Migrate', false);
      await waitForStatusIcon(statusIcons.migrating, PAGE_LOAD_TIMEOUT_SECS);
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).toContain(CANCEL_MIGRATION);
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'Migrate VM',
    async () => {
      await vm.action('Start');
      const sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

      await vm.action('Migrate');
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      expect(statusIcon(statusIcons.running).isPresent()).toBeTruthy();
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT,
  );

  it(
    'Migrate already migrated VM',
    async () => {
      await vm.action('Start');
      let sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

      await vm.action('Migrate');
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

      await vm.action('Migrate');
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      expect(statusIcon(statusIcons.running).isPresent()).toBeTruthy();
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT * 2,
  );

  it(
    'Cancel ongoing VM migration',
    async () => {
      await vm.action('Start');
      const sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

      // Start migration without waiting for it to finish
      await vm.action('Migrate', false);
      await waitForStatusIcon(statusIcons.migrating, VM_MIGRATION_TIMEOUT_SECS);

      await vm.action('Cancel', false);
      await waitForStatusIcon(statusIcons.running, VM_BOOTUP_TIMEOUT_SECS);
      await browser.wait(
        waitForStringInElement(vmDetailNode(vm.namespace, vm.name), sourceNode),
        VM_MIGRATION_TIMEOUT_SECS,
      );
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );
});
