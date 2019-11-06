import { browser } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  createResource,
  deleteResource,
  waitForStringInElement,
} from '@console/shared/src/test-utils/utils';
import { getDetailActionDropdownOptions } from '../views/vm.actions.view';
import {
  statusIcon,
  statusIcons,
  vmDetailNode,
  waitForStatusIcon,
} from '../views/virtualMachine.view';
import { getRandStr } from './utils/utils';
import { getVMManifest } from './utils/mocks';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_ACTIONS,
  TABS,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';

describe('Test VM Migration', () => {
  let testVm;
  let vm: VirtualMachine;

  const MIGRATE_VM = 'Migrate Virtual Machine';
  const CANCEL_MIGRATION = 'Cancel Virtual Machine Migration';
  const VM_BOOT_AND_MIGRATE_TIMEOUT = VM_BOOTUP_TIMEOUT_SECS + VM_MIGRATION_TIMEOUT_SECS;

  beforeEach(async () => {
    testVm = getVMManifest('URL', testName, `migrationvm-${getRandStr(4)}`);
    vm = new VirtualMachine(testVm.metadata);
    createResource(testVm);
    await vm.navigateToTab(TABS.OVERVIEW);
    await waitForStatusIcon(statusIcons.off, VM_IMPORT_TIMEOUT_SECS);
  }, VM_IMPORT_TIMEOUT_SECS);

  afterEach(() => {
    deleteResource(testVm);
  });

  it(
    'Migrate VM action button is displayed appropriately',
    async () => {
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.action(VM_ACTIONS.START);
      expect(await getDetailActionDropdownOptions()).toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.action(VM_ACTIONS.MIGRATE, false);
      await waitForStatusIcon(statusIcons.migrating, PAGE_LOAD_TIMEOUT_SECS);
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).toContain(CANCEL_MIGRATION);
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'Migrate already migrated VM',
    async () => {
      await vm.action(VM_ACTIONS.START);
      let sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

      await vm.action(VM_ACTIONS.MIGRATE);
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

      await vm.action(VM_ACTIONS.MIGRATE);
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      expect(statusIcon(statusIcons.running).isPresent()).toBeTruthy();
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT * 2,
  );

  it(
    'Cancel ongoing VM migration',
    async () => {
      await waitForStatusIcon(statusIcons.off, VM_IMPORT_TIMEOUT_SECS);
      await vm.action(VM_ACTIONS.START);
      const sourceNode = await vmDetailNode(vm.namespace, vm.name).getText();

      // Start migration without waiting for it to finish
      await vm.action(VM_ACTIONS.MIGRATE, false);
      await waitForStatusIcon(statusIcons.migrating, VM_MIGRATION_TIMEOUT_SECS);

      await vm.action(VM_ACTIONS.CANCEL, false);
      await waitForStatusIcon(statusIcons.running, VM_BOOTUP_TIMEOUT_SECS);
      await browser.wait(
        waitForStringInElement(vmDetailNode(vm.namespace, vm.name), sourceNode),
        VM_MIGRATION_TIMEOUT_SECS,
      );
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );
});
