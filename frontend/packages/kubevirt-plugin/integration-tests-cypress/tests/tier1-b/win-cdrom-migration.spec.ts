import { testName } from '../../support';
// const testName = 'manual-four-ten';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, TEMPLATE, VM_STATUS } from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { storageClass } from '../../views/selector';
import * as wizardView from '../../views/selector-wizard';
import { virtualization } from '../../views/virtualization';
import { vm, waitForStatus } from '../../views/vm';
import { wizard } from '../../views/wizard';

const winData: VirtualMachineData = {
  name: `win10-cdrom-${testName}`,
  description: 'Windows 10 w/CD-ROM boot source',
  namespace: testName,
  template: TEMPLATE.WIN10,
  provisionSource: ProvisionSource.WIN10_URL,
  pvcSize: '2',
  cdrom: true,
  sshEnable: false,
  startOnCreation: true,
};

describe('Test Windows VM with CDROM migration', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
  });

  after(() => {
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      cy.deleteResource(K8S_KIND.VM, winData.name, winData.namespace);
    }
    cy.deleteTestProject(testName);
  });

  it(`ID(CNV-7497) Windows VM with CDROM migration`, () => {
    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      virtualization.vms.visit();
      wizard.vm.open();
      wizard.vm.selectTemplate(winData);
      cy.get(wizardView.imageSourceDropdown).click();
      cy.get(wizardView.selectMenu)
        .contains(winData.provisionSource.getDescription())
        .click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.get(wizardView.sourceURL)
        .clear()
        .type(winData.provisionSource.getSource());
      cy.get(wizardView.pvcSize)
        .clear()
        .type(winData.pvcSize);
      cy.get(wizardView.cdrom).check();
      cy.get('button.pf-c-expandable-section__toggle').then(($btn) => {
        if ($btn.attr('aria-expanded') !== 'true') {
          $btn.click();
        }
      });
      cy.get(storageClass.dropdown)
        .should('be.visible')
        .click();
      cy.get(wizardView.dropDownItemLink)
        .contains(Cypress.env('STORAGE_CLASS'))
        .click();
      cy.contains('Access mode').should('exist');
      cy.get(wizardView.storageProfile).uncheck();
      cy.get(wizardView.accessMode('ReadWriteMany')).check();
      cy.get(wizardView.customizeBtn).click();
      cy.get(wizardView.vmName)
        .clear()
        .type(winData.name);
      cy.get(wizardView.mountWGT).uncheck();
      cy.get(wizardView.nextBtn).click();
      cy.get(wizardView.nextBtn).click();
      cy.get(`${wizardView.rootdisk}[data-index="1"]`)
        .find(wizardView.kebabBtn)
        .click();
      cy.get(wizardView.deleteBtn).click();
      cy.contains('Disk with this name already exists!').should('not.exist');
      cy.get(wizardView.reviewBtn).click();
      cy.get(wizardView.nextBtn).click();
      cy.get('.pf-c-button.pf-m-primary')
        // .contains('See virtual machine details')
        .should('exist')
        .click();
      vm.migrate();
      waitForStatus(VM_STATUS.Migrating);
      waitForStatus(VM_STATUS.Running);
    }
  });
});
