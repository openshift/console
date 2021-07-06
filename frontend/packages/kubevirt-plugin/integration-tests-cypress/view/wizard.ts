import { ProvisionSource } from '../enums/provisionSource';
import { VirtualMachineData } from '../types/vm';
import { addDisk, addNIC } from './dialog';
import { modalTitle, modalConfirm, storageClass } from './selector';
import * as wizardView from './selector-wizard';

const fillBootSource = (
  provisionSource: ProvisionSource,
  pvcName: string,
  pvcNS: string,
  pvcSize?: string,
) => {
  cy.get(wizardView.imageSourceDropdown).click();
  cy.get(wizardView.selectMenu)
    .contains(provisionSource.getDescription())
    .click({ force: true });
  switch (provisionSource) {
    case ProvisionSource.URL: {
      cy.get(wizardView.sourceURL).type(provisionSource.getSource());
      if (pvcSize) {
        cy.get(wizardView.pvcSize)
          .clear()
          .type(pvcSize);
      }
      break;
    }
    case ProvisionSource.CLONE_PVC: {
      cy.get('body').then(($body) => {
        if ($body.find(wizardView.clonePVCNSDropdown).length) {
          cy.get(wizardView.clonePVCNSDropdown).click();
          cy.get(wizardView.projectNS(pvcNS)).click();
          cy.contains(wizardView.clonePVCDropDown, 'Select Persistent Volume Claim').click({
            force: true,
          });
          cy.get(wizardView.pvcName(pvcName)).click();
        } else {
          cy.get(wizardView.pvcNSDropdown).click();
          cy.get(wizardView.projectNS(pvcNS)).click();
          cy.get(wizardView.pvcDropdown).click();
          cy.get(wizardView.pvcName(pvcName)).click();
        }
      });
      break;
    }
    case ProvisionSource.REGISTRY: {
      cy.get(wizardView.sourceRegistry).type(provisionSource.getSource());
      if (pvcSize) {
        cy.get(wizardView.pvcSize)
          .clear()
          .type(pvcSize);
      }
      break;
    }
    default: {
      break;
    }
  }
};

export const wizard = {
  vm: {
    open: () => {
      cy.get(wizardView.create).click();
      cy.get(wizardView.vmWizard).click();
    },
    selectTemplate: (vmData: VirtualMachineData) => {
      const { template } = vmData;
      cy.get(wizardView.templateTitle)
        .contains(template)
        .should('exist')
        .click();
      cy.get(wizardView.next).click();
      cy.get('body').then(($body) => {
        if ($body.find(modalTitle).length) {
          cy.get(modalConfirm).click();
        }
      });
    },
    fillBootSourceForm: (vmData: VirtualMachineData) => {
      const { provisionSource, cdrom, pvcSize, pvcNS, pvcName } = vmData;
      fillBootSource(provisionSource, pvcName, pvcNS, pvcSize);
      if (cdrom) {
        cy.get(wizardView.cdrom).click();
      }
      if (Cypress.env('STORAGE_CLASS')) {
        cy.get(storageClass.advanced).within(() =>
          cy
            .get('button')
            .contains('Advanced')
            .click(),
        );
        cy.get(storageClass.dropdown).click();
        cy.get(storageClass.selectMenu)
          .contains(Cypress.env('STORAGE_CLASS'))
          .click();
      }
      cy.get(wizardView.next).click();
    },
    fillReviewForm: (vmData: VirtualMachineData) => {
      const { namespace, name, flavor, sshEnable, startOnCreation } = vmData;
      if (namespace !== undefined) {
        cy.get(wizardView.projectDropdown).click();
        cy.get(wizardView.projectNS(namespace)).click();
      }
      if (name !== undefined) {
        cy.get(wizardView.vmName)
          .clear()
          .type(name);
      }
      if (flavor !== undefined) {
        cy.get(wizardView.flavorSelect).click();
        cy.get('button')
          .contains(flavor)
          .click();
      }
      if (!sshEnable) {
        cy.get(wizardView.sshCheckbox).click();
      }
      if (!startOnCreation) {
        cy.get(wizardView.startOnCreation).click();
      }
      cy.get(wizardView.next).click();
      cy.get(wizardView.successList).click();
    },
    fillGeneralForm: (vmData: VirtualMachineData) => {
      const { name, provisionSource, sourceAvailable, flavor, pvcName, pvcNS } = vmData;
      cy.get(wizardView.vmName)
        .clear()
        .type(name);
      if (!sourceAvailable) {
        fillBootSource(provisionSource, pvcName, pvcNS);
      }
      if (flavor !== undefined) {
        cy.get(wizardView.flavorDropdown).click();
        cy.get(wizardView.selectItem)
          .contains(flavor)
          .click();
      }
      cy.get(wizardView.nextBtn).click();
    },
    fillNetworkForm: (vmData: VirtualMachineData) => {
      const { networkInterfaces, provisionSource } = vmData;
      if (networkInterfaces !== undefined) {
        networkInterfaces.forEach((nic) => {
          addNIC(nic);
        });
      }
      if (provisionSource === ProvisionSource.PXE && networkInterfaces !== undefined) {
        cy.get(wizardView.selectPXENIC).select(networkInterfaces[0].name);
      }
      cy.get(wizardView.nextBtn).click();
    },
    fillStorageForm: (vmData: VirtualMachineData) => {
      const { disks } = vmData;
      if (disks !== undefined) {
        disks.forEach((disk) => {
          addDisk(disk);
        });
      }
      cy.get(wizardView.nextBtn).click();
    },
    fillAdvancedForm: (vmData: VirtualMachineData) => {
      const { cloudInit, sshEnable } = vmData;
      if (cloudInit !== undefined) {
        cy.get(wizardView.cloudInit).click();
        if (cloudInit.yamlView) {
          cy.get(wizardView.yamlView).click();
          cy.get(wizardView.yamlEditor)
            .clear()
            .type(cloudInit.customScript);
        } else {
          cy.get(wizardView.username)
            .clear()
            .type(cloudInit.userName);
          cy.get(wizardView.password)
            .clear()
            .type(cloudInit.password);
          cy.get(wizardView.hostname)
            .clear()
            .type(cloudInit.hostname);
          if (cloudInit.sshKeys !== undefined) {
            cloudInit.sshKeys.forEach((key: string, index: number) => {
              cy.get(wizardView.sshKeys(index))
                .clear()
                .type(key);
              cy.get(wizardView.addSSHKey).click();
            });
          }
        }
      }
      if (sshEnable) {
        cy.get(wizardView.ssh).click();
        cy.get(wizardView.sshCheckbox).click();
      }
      cy.get(wizardView.nextBtn).click();
    },
    fillConfirmForm: (vmData: VirtualMachineData) => {
      const { startOnCreation } = vmData;
      if (!startOnCreation) {
        cy.get(wizardView.startOnCreation).click();
      }
      cy.get(wizardView.nextBtn).click();
      cy.get(wizardView.successList).click();
    },
  },
  template: {
    open: () => {
      cy.byLegacyTestID('item-create').click();
      cy.byLegacyTestID('template-wizard').click();
    },
    createTemplate: (
      name: string,
      provider: string,
      supported: boolean,
      baseOS = 'Red Hat Enterprise Linux 7.0 or higher',
    ) => {
      cy.get('#vm-name').type(name);
      cy.get('#template-provider').type(provider);
      if (supported) {
        cy.get('#template-supported').click();
        cy.get('button')
          .contains('Support by template provider')
          .click();
      }
      cy.get('#operating-system-dropdown').click();
      cy.get('button')
        .contains(baseOS)
        .click({ force: true });
      cy.get('#image-source-type-dropdown').click();
      cy.get('.pf-c-select__menu')
        .contains(ProvisionSource.REGISTRY.getDescription())
        .click();
      cy.get('input[id="provision-source-container"]').type(ProvisionSource.REGISTRY.getSource());
      cy.get('#create-vm-wizard-reviewandcreate-btn').click();
      cy.get('#create-vm-wizard-submit-btn').click();
      cy.byTestID('success-list').click();
    },
  },
};
