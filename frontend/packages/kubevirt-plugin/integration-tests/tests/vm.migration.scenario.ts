import { browser } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  createResource,
  deleteResource,
  waitForStringInElement,
} from '@console/shared/src/test-utils/utils';
import { getDetailActionDropdownOptions } from '../views/vm.actions.view';
import { vmDetailNode } from '../views/virtualMachine.view';
import { getRandStr } from './utils/utils';
import { getVMManifest } from './utils/mocks';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_ACTION,
  VM_STATUS,
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
    await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
  }, VM_IMPORT_TIMEOUT_SECS);

  afterEach(() => {
    deleteResource(testVm);
  });

  it(
    'ID(CNV-2140) Migrate VM action button is displayed appropriately',
    async () => {
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.action(VM_ACTION.Start);
      expect(await getDetailActionDropdownOptions()).toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.action(VM_ACTION.Migrate, false);
      await vm.waitForStatus(VM_STATUS.Migrating, PAGE_LOAD_TIMEOUT_SECS);
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).toContain(CANCEL_MIGRATION);
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-2133) Migrate already migrated VM',
    async () => {
      await vm.action(VM_ACTION.Start);
      let sourceNode = await vm.getNode();

      await vm.action(VM_ACTION.Migrate);
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      sourceNode = await vm.getNode();

      await vm.action(VM_ACTION.Migrate);
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      expect(vm.getStatus()).toEqual(VM_STATUS.Running);
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT * 2,
  );

  it(
    'ID(CNV-2132) Cancel ongoing VM migration',
    async () => {
      await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
      await vm.action(VM_ACTION.Start);
      const sourceNode = await vm.getNode();

      // Start migration without waiting for it to finish
      await vm.action(VM_ACTION.Migrate, false);
      await vm.waitForStatus(VM_STATUS.Migrating, VM_MIGRATION_TIMEOUT_SECS);

      await vm.action(VM_ACTION.Cancel, false);
      await vm.waitForStatus(VM_STATUS.Running, VM_BOOTUP_TIMEOUT_SECS);
      await browser.wait(
        waitForStringInElement(vmDetailNode(vm.namespace, vm.name), sourceNode),
        VM_MIGRATION_TIMEOUT_SECS,
      );
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );
});
