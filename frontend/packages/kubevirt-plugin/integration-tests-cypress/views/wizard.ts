import { VirtualMachineData } from '../types/vm';
import { TEMPLATE_SUPPORT } from '../utils/const/index';
import { ProvisionSource } from '../utils/const/provisionSource';
import { wizardTitle } from '../utils/const/string';
import { addDisk, addNIC } from './dialog';
import { modalCancel, modalConfirm, modalTitle, storageClass } from './selector';
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
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
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
      cy.get(wizardView.sourceRegistry)
        .clear()
        .type(provisionSource.getSource());
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
      cy.get(wizardView.createVM).click();
      cy.get(wizardView.vmWizard).click();
    },
    selectTemplate: (vmData: VirtualMachineData) => {
      cy.get(wizardView.templateTitle)
        .contains(vmData.template.name)
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
        cy.get(storageClass.advanced)
          .find('.pf-c-expandable-section__toggle-icon')
          .click();
        cy.get(storageClass.dropdown).click();
        cy.get(wizardView.dropDownItemLink)
          .contains(Cypress.env('STORAGE_CLASS'))
          .click();
        cy.contains('Access mode').should('exist');
      }
      cy.get(wizardView.next).click();
    },
    fillReviewForm: (vmData: VirtualMachineData) => {
      const { namespace, name, flavor, sshEnable, startOnCreation } = vmData;
      cy.contains(wizardTitle).should('exist');
      if (namespace !== undefined) {
        cy.get(wizardView.projectDropdown).click();
        cy.get(wizardView.dropDownItemLink)
          .contains(namespace)
          .click();
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
      cy.loaded();
    },
    fillGeneralForm: (vmData: VirtualMachineData) => {
      const {
        name,
        templateProvider,
        templateSupport,
        os,
        provisionSource,
        sourceAvailable,
        flavor,
        pvcName,
        pvcNS,
      } = vmData;
      cy.get(wizardView.vmName)
        .clear()
        .type(name);
      if (templateProvider !== undefined) {
        cy.get(wizardView.templateProvider)
          .clear()
          .type(templateProvider);
      }
      if (templateSupport !== undefined && !templateSupport) {
        cy.get(wizardView.templateSupport).click();
        cy.get(wizardView.selectItem)
          .contains(TEMPLATE_SUPPORT)
          .click();
      }
      if (os !== undefined) {
        cy.get(wizardView.osDropdown).click();
        cy.get(wizardView.selectItem)
          .contains(os)
          .click({ force: true });
      }
      if (!sourceAvailable) {
        fillBootSource(provisionSource, pvcName, pvcNS);
      }
      if (flavor !== undefined) {
        cy.get(wizardView.flavorDropdown).click();
        cy.get(wizardView.selectItem)
          .contains(flavor)
          .click();
      }
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000);
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
      const { disks, provisionSource } = vmData;
      if (Cypress.env('STORAGE_CLASS') && provisionSource !== ProvisionSource.CLONE_PVC) {
        cy.get(wizardView.rootdisk)
          .find(wizardView.kebabBtn)
          .click();
        cy.get('[data-test-action="Edit"]').click();
        cy.get(storageClass.dropdown).click();
        cy.get(wizardView.dropDownItemLink)
          .contains(Cypress.env('STORAGE_CLASS'))
          .click();
        cy.contains('Access mode').should('exist');
        cy.get(modalConfirm).click();
        cy.get(modalCancel).should('not.exist');
      }
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
      const { provisionSource, startOnCreation } = vmData;

      // enhancement for https://issues.redhat.com/browse/CNV-5162
      if (provisionSource === ProvisionSource.URL) {
        cy.get(wizardView.bootSource).should('contain', provisionSource.getSource());
      }

      cy.get('body').then(($body) => {
        if ($body.find(wizardView.startOnCreation).length) {
          if (!startOnCreation) {
            cy.get(wizardView.startOnCreation).click();
          }
        }
      });
      cy.get(wizardView.nextBtn).click();
      cy.get(wizardView.successList).click();
      cy.loaded();
    },
  },
  template: {
    open: () => {
      cy.byTestID('item-create').click();
      cy.get('[data-test-dropdown-menu="wizard"]').click();
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
      cy.get('#provision-source-container').type(ProvisionSource.REGISTRY.getSource());
      cy.get('#create-vm-wizard-reviewandcreate-btn').click();
      cy.get('#create-vm-wizard-submit-btn').click();
      cy.byTestID('success-list').click();
    },
  },
};
