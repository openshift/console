import { VM_ACTION, VM_ACTION_TIMEOUT, VM_STATUS, VMI_ACTION } from '../const/index';
import { VirtualMachineData } from '../types/vm';
import { detailViewAction, listViewAction } from './actions';
import { createYAMLButton, detailsTab, disksTab } from './selector';
import { create, vmYAML } from './selector-wizard';
import { virtualization } from './virtualization';
import { wizard } from './wizard';

export const waitForStatus = (status: string, vmData?: VirtualMachineData, timeout?: number) => {
  const timeOut = timeout || VM_ACTION_TIMEOUT.VM_IMPORT;
  if (status === VM_STATUS.Running) {
    const { name, namespace } = vmData;
    cy.waitForLoginPrompt(name, namespace);
  }

  if (status === VM_STATUS.Starting) {
    const startingStatuses = [VM_STATUS.Starting, VM_STATUS.Provisioning];
    const regex = new RegExp(`${startingStatuses.join('|')}`, 'g');
    cy.contains(detailsTab.vmStatus, regex, { timeout: timeOut }).should('exist');
  } else cy.contains(detailsTab.vmStatus, status, { timeout: timeOut }).should('exist');
};

export const action = (selector: string) => {
  cy.get('body').then(($body) => {
    if ($body.text().includes('Filter')) {
      listViewAction(selector);
    }
    if ($body.text().includes('Actions')) {
      cy.byLegacyTestID('horizontal-link-Details').click();
      detailViewAction(selector);
    }
  });
};

export const vm = {
  create: (vmData: VirtualMachineData) => {
    const { startOnCreation, sourceAvailable } = vmData;
    virtualization.vms.visit();
    wizard.vm.open();
    wizard.vm.selectTemplate(vmData);
    if (!sourceAvailable) {
      wizard.vm.fillBootSourceForm(vmData);
    }
    wizard.vm.fillReviewForm(vmData);
    if (startOnCreation) {
      waitForStatus(VM_STATUS.Starting, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
      waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    } else {
      waitForStatus(VM_STATUS.Stopped, vmData, VM_ACTION_TIMEOUT.VM_IMPORT);
    }
  },
  customizeCreate: (vmData: VirtualMachineData) => {
    const { startOnCreation } = vmData;
    virtualization.vms.visit();
    wizard.vm.open();
    wizard.vm.selectTemplate(vmData);
    cy.byLegacyTestID('wizard-customize').click();
    wizard.vm.fillGeneralForm(vmData);
    wizard.vm.fillNetworkForm(vmData);
    wizard.vm.fillStorageForm(vmData);
    wizard.vm.fillAdvancedForm(vmData);
    wizard.vm.fillConfirmForm(vmData);
    if (startOnCreation) {
      waitForStatus(VM_STATUS.Starting, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
      waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    } else {
      waitForStatus(VM_STATUS.Stopped, vmData, VM_ACTION_TIMEOUT.VM_IMPORT);
    }
  },
  start: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Stopped);
    action(VM_ACTION.Start);
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
  },
  restart: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    action(VM_ACTION.Restart);
    waitForStatus(VM_STATUS.Starting, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
  },
  stop: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    action(VM_ACTION.Stop);
    waitForStatus(VM_STATUS.Stopped);
  },
  delete: () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Instance')) {
        action(VMI_ACTION.Delete);
      } else {
        action(VM_ACTION.Delete);
      }
    });
    cy.byTestID('create-vm-empty').should('be.visible');
  },
  unpause: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Paused);
    action(VM_ACTION.Unpause);
    waitForStatus(VM_STATUS.Running, vmData);
  },
  migrate: (vmData: VirtualMachineData, waitForComplete = true) => {
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    action(VM_ACTION.Migrate);
    if (waitForComplete) {
      waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_MIGRATE);
    }
  },
  pause: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    action(VM_ACTION.Pause);
    waitForStatus(VM_STATUS.Paused, vmData);
  },
  createFromYAML: () => {
    virtualization.vms.visit();
    cy.get(create).click();
    cy.get(vmYAML).click();
    cy.get(createYAMLButton).click();
  },
};

export const waitForVMStatusLabel = (status: string, timeout?: number) => {
  const timeOut = timeout || VM_ACTION_TIMEOUT.VM_BOOTUP;
  cy.contains(disksTab.currVMStatusLbl, status, { timeout: timeOut }).should('exist');
};
