import { VirtualMachineData } from '../types/vm';
import {
  TEMPLATE_ACTION,
  VM_ACTION,
  VM_ACTION_TIMEOUT,
  VM_STATUS,
  VMI_ACTION,
} from '../utils/const/index';
import { detailViewAction, listViewAction } from './actions';
import {
  detailsTab,
  createVMBtn,
  templateLink,
  row,
  resourceStatus,
  detailsStatus,
} from './selector';
import { customizeBtn } from './selector-wizard';
import { virtualization } from './virtualization';
import { wizard } from './wizard';

export const waitForStatus = (status: string) => {
  switch (status) {
    case VM_STATUS.Running: {
      cy.contains(detailsTab.vmStatus, /^Running$/, {
        timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
      }).should('exist');
      // wait for vmi appear
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000);
      break;
    }
    case VM_STATUS.Stopped: {
      cy.contains(detailsTab.vmStatus, VM_STATUS.Stopped, {
        timeout: VM_ACTION_TIMEOUT.VM_IMPORT,
      }).should('exist');
      break;
    }
    case VM_STATUS.Starting: {
      cy.contains(detailsTab.vmStatus, VM_STATUS.Starting, {
        timeout: VM_ACTION_TIMEOUT.VM_IMPORT,
      }).should('exist');
      break;
    }
    default: {
      cy.contains(detailsTab.vmStatus, status).should('exist');
      break;
    }
  }
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

export const wizardFlow = (vmData: VirtualMachineData) => {
  if (!vmData.sourceAvailable) {
    wizard.vm.fillBootSourceForm(vmData);
  }
  wizard.vm.fillReviewForm(vmData);
  if (vmData.startOnCreation) {
    waitForStatus(VM_STATUS.Running);
  } else {
    waitForStatus(VM_STATUS.Stopped);
  }
};

export const advanceWizardFlow = (vmData: VirtualMachineData) => {
  cy.get(customizeBtn).click();
  wizard.vm.fillGeneralForm(vmData);
  wizard.vm.fillNetworkForm(vmData);
  wizard.vm.fillStorageForm(vmData);
  wizard.vm.fillAdvancedForm(vmData);
  wizard.vm.fillConfirmForm(vmData);
  if (vmData.startOnCreation) {
    waitForStatus(VM_STATUS.Running);
  } else {
    waitForStatus(VM_STATUS.Stopped);
  }
};

export const vm = {
  create: (vmData: VirtualMachineData, customize = false) => {
    virtualization.vms.visit();
    wizard.vm.open();
    wizard.vm.selectTemplate(vmData);
    if (customize) {
      advanceWizardFlow(vmData);
    } else {
      wizardFlow(vmData);
    }
  },
  start: () => {
    waitForStatus(VM_STATUS.Stopped);
    action(VM_ACTION.Start);
    waitForStatus(VM_STATUS.Starting);
    waitForStatus(VM_STATUS.Running);
  },
  restart: () => {
    waitForStatus(VM_STATUS.Running);
    action(VM_ACTION.Restart);
    waitForStatus(VM_STATUS.Starting);
    waitForStatus(VM_STATUS.Running);
  },
  stop: () => {
    waitForStatus(VM_STATUS.Running);
    action(VM_ACTION.Stop);
    waitForStatus(VM_STATUS.Stopped);
    // wait for VMI to disappear
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(15000);
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
  unpause: () => {
    waitForStatus(VM_STATUS.Paused);
    action(VM_ACTION.Unpause);
    waitForStatus(VM_STATUS.Running);
  },
  migrate: (waitForComplete = true) => {
    waitForStatus(VM_STATUS.Running);
    action(VM_ACTION.Migrate);
    if (waitForComplete) {
      waitForStatus(VM_STATUS.Running);
    }
  },
  pause: () => {
    waitForStatus(VM_STATUS.Running);
    action(VM_ACTION.Pause);
  },
  createFromCreateVMBtn: (vmData: VirtualMachineData, customize = false) => {
    virtualization.templates.visit();
    cy.contains(row, 'Add source').should('exist');
    cy.contains(row, vmData.template.name).should('exist');
    cy.contains(row, vmData.template.name)
      .find(createVMBtn)
      .click();
    if (customize) {
      advanceWizardFlow(vmData);
    } else {
      wizardFlow(vmData);
    }
  },
  createFromActionsBtn: (vmData: VirtualMachineData, customize = false) => {
    virtualization.templates.visit();
    cy.contains(row, 'Add source').should('exist');
    cy.contains(row, vmData.template.name).should('exist');
    cy.get(templateLink(vmData.template.metadataName)).click({ force: true });
    detailViewAction(TEMPLATE_ACTION.Create);
    if (customize) {
      advanceWizardFlow(vmData);
    } else {
      wizardFlow(vmData);
    }
  },
};

export const waitForVMStatusLabel = (status: string, timeout?: number) => {
  cy.get('[data-test-id="perspective-switcher-toggle"]').then(($btn) => {
    const timeOut = timeout || VM_ACTION_TIMEOUT.VM_IMPORT;
    const statusLabel = $btn.text() === 'Administrator' ? resourceStatus : detailsStatus;
    switch (status) {
      case VM_STATUS.Running: {
        cy.get(statusLabel, {
          timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
        })
          .contains(/^Running$/)
          .should('exist');
        // cy.contains(detailsTab.vmStatus, /^Running$/, ).should('exist');
        // wait for vmi appear
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3000);
        break;
      }
      case VM_STATUS.Stopped: {
        cy.get(statusLabel, {
          timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
        })
          .contains(VM_STATUS.Stopped)
          .should('exist');
        break;
      }
      case VM_STATUS.Starting: {
        cy.get(statusLabel, {
          timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
        })
          .contains(VM_STATUS.Starting)
          .should('exist');
        break;
      }
      default: {
        cy.get(statusLabel, {
          timeout: timeOut,
        })
          .contains(status)
          .should('exist');
        break;
      }
    }
  });
};
