import { $, browser, ExpectedConditions as until } from 'protractor';
import { detailViewAction, getDetailActionDropdownOptions } from '../utils/shared-actions.view';
import { click, deleteResource, waitForStringInElement } from '../utils/shared-utils';
import { confirmButton } from '../views/uiResource.view';
import { vmDetailNode } from '../views/virtualMachine.view';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { VMBuilder } from './models/vmBuilder';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  STORAGE_CLASS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
} from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VM_ACTION, VM_STATUS } from './utils/constants/vm';

describe('Test VM Migration', () => {
  const MIGRATE_VM = 'Migrate Virtual Machine';
  const CANCEL_MIGRATION = 'Cancel Virtual Machine Migration';
  const VM_BOOT_AND_MIGRATE_TIMEOUT = VM_BOOTUP_TIMEOUT_SECS + VM_MIGRATION_TIMEOUT_SECS;

  const vm = new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.URL)
    .setStartOnCreation(false)
    .generateNameForPrefix('vm-for-migration-test')
    .build();

  beforeAll(async () => {
    await vm.create();
    await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
  });

  afterAll(async () => {
    deleteResource(vm.asResource());
  });

  it(
    'ID(CNV-2140) Migrate VM action button is displayed appropriately',
    async () => {
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.detailViewAction(VM_ACTION.Start);
      expect(await getDetailActionDropdownOptions()).toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      if (STORAGE_CLASS === 'ocs-storagecluster-ceph-rbd') {
        await vm.detailViewAction(VM_ACTION.Migrate, false);
        await vm.waitForStatus(VM_STATUS.Migrating, PAGE_LOAD_TIMEOUT_SECS);
        expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
        expect(await getDetailActionDropdownOptions()).toContain(CANCEL_MIGRATION);
      }
      if (STORAGE_CLASS === 'hostpath-provisioner') {
        const errorAlert = $('.pf-c-alert.pf-m-inline.pf-m-danger.co-alert.co-alert--scrollable');
        await detailViewAction(VM_ACTION.Migrate, false);
        await click(confirmButton);
        await browser.wait(until.presenceOf(errorAlert), PAGE_LOAD_TIMEOUT_SECS);
        expect(await errorAlert.getText()).toContain('all PVCs must be shared');
        const cancelButton = $('[data-test-id="modal-cancel-action"]');
        click(cancelButton);
      }
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT,
  );

  it(
    'ID(CNV-2133) Migrate already migrated VM',
    async () => {
      if (STORAGE_CLASS === 'ocs-storagecluster-ceph-rbd') {
        let sourceNode = await vm.getNode();

        await vm.detailViewAction(VM_ACTION.Migrate);
        await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
        sourceNode = await vm.getNode();

        await vm.detailViewAction(VM_ACTION.Migrate);
        await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
        expect(await vm.getStatus()).toEqual(VM_STATUS.Running);
      }
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT,
  );

  it(
    'ID(CNV-2132) Cancel ongoing VM migration',
    async () => {
      if (STORAGE_CLASS === 'ocs-storagecluster-ceph-rbd') {
        const sourceNode = await vm.getNode();

        // Start migration without waiting for it to finish
        await vm.detailViewAction(VM_ACTION.Migrate, false);
        await vm.waitForStatus(VM_STATUS.Migrating, VM_MIGRATION_TIMEOUT_SECS);

        await vm.detailViewAction(VM_ACTION.Cancel, false);
        await vm.waitForStatus(VM_STATUS.Running, VM_BOOT_AND_MIGRATE_TIMEOUT);
        await browser.wait(
          waitForStringInElement(vmDetailNode(vm.namespace, vm.name), sourceNode),
          VM_MIGRATION_TIMEOUT_SECS,
        );
      }
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT,
  );
});
