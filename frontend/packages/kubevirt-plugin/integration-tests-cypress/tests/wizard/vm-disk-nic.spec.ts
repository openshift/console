import { testName } from '../../support';
import { Disk, Network, VirtualMachineData } from '../../types/vm';
import {
  EXAMPLE_VM_NIC,
  K8S_KIND,
  NAD_NAME,
  NIC_MODEL,
  NIC_TYPE,
  TEMPLATE,
  YAML_VM_NAME,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { addDisk, addNIC, deleteRow } from '../../views/dialog';
import { nicDialog, menuItemMain, modalCancel } from '../../views/selector';
import { cancelBtn } from '../../views/selector-wizard';
import { tab } from '../../views/tab';
import { wizard } from '../../views/wizard';

const nic1: Network = {
  name: 'nic-1',
  nad: 'bridge-network',
};

const nic2: Network = {
  name: 'nic-2',
  nad: 'bridge-network',
};

const disk1: Disk = {
  name: 'disk-1',
  size: '1',
};

const vmData: VirtualMachineData = {
  name: `validate-nic-${testName}`,
  namespace: testName,
  template: TEMPLATE.WIN10,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
};

function visitNetworkStep(data: VirtualMachineData) {
  cy.visitVMsList();
  wizard.vm.open();
  wizard.vm.selectTemplate(data);
  cy.byLegacyTestID('wizard-customize').click();
  wizard.vm.fillGeneralForm(data);
}

describe('Test VM Disk/NIC', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.createNAD(testName);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.NAD, NAD_NAME, testName);
    cy.deleteTestProject(testName);
  });

  describe('Test Disk/NIC on VM tabs', () => {
    before(() => {
      cy.createDefaultVM();
    });

    after(() => {
      cy.deleteResource(K8S_KIND.VM, YAML_VM_NAME, testName);
    });

    it('ID(CNV-1502) Add/remove disk on VM disks page', () => {
      tab.navigateToDisk();
      addDisk(disk1);
      deleteRow(disk1.name);
    });

    it('ID(CNV-1501) Add/remove nic on VM Network Interfaces page', () => {
      tab.navigateToNetwork();
      addNIC(nic1);
      addNIC(nic2); // (CNV-1722) NAD can be used in second NIC
      deleteRow(nic1.name);
      deleteRow(nic2.name);
    });

    it('ID(CNV-4038) Test example VM NIC sets', () => {
      tab.navigateToNetwork();
      cy.byDataID(EXAMPLE_VM_NIC.Name)
        .find('td')
        .eq(1)
        .should('contain', EXAMPLE_VM_NIC.Model);
      cy.byDataID(EXAMPLE_VM_NIC.Name)
        .find('td')
        .eq(2)
        .should('contain', EXAMPLE_VM_NIC.Network);
      cy.byDataID(EXAMPLE_VM_NIC.Name)
        .find('td')
        .eq(3)
        .should('contain', EXAMPLE_VM_NIC.Type);
    });
  });

  describe('Test network type presets and options in wizard', () => {
    before(() => {
      visitNetworkStep(vmData);
    });

    after(() => {
      cy.get(cancelBtn).click();
      cy.byButtonText('Cancel').click();
    });

    it('ID(CNV-2073) Test NIC default set', () => {
      cy.byDataID(EXAMPLE_VM_NIC.Name)
        .find('td')
        .eq(1)
        .should('contain', NIC_MODEL.e1000e);
      cy.byDataID(EXAMPLE_VM_NIC.Name)
        .find('td')
        .eq(2)
        .should('contain', EXAMPLE_VM_NIC.Network);
      cy.byDataID(EXAMPLE_VM_NIC.Name)
        .find('td')
        .eq(3)
        .should('contain', EXAMPLE_VM_NIC.Type);
    });

    it('ID(CNV-4781) Test NIC supported models', () => {
      cy.get(nicDialog.addNIC).click();
      cy.get(nicDialog.model).click();
      cy.get(menuItemMain).should('have.length', 2);
      cy.get(menuItemMain)
        .eq(0)
        .should('contain', NIC_MODEL.virtio);
      cy.get(menuItemMain)
        .eq(1)
        .should('contain', NIC_MODEL.e1000e);
      cy.get(modalCancel).click();
    });

    it('Test NIC supported types', () => {
      cy.get(nicDialog.addNIC).click();
      cy.get(nicDialog.NAD)
        .select(nic1.nad)
        .should('have.value', nic1.nad);
      cy.get(nicDialog.nicType).click();
      cy.get(menuItemMain).should('have.length', 2);
      cy.get(menuItemMain)
        .eq(0)
        .should('contain', NIC_TYPE.Bridge);
      cy.get(menuItemMain)
        .eq(1)
        .should('contain', NIC_TYPE.SR_IOV);
      cy.get(modalCancel).click();
    });

    it('ID(CNV-4780) NIC model is disabled when SR-IOV is selected', () => {
      cy.get(nicDialog.addNIC).click();
      cy.get(nicDialog.NAD)
        .select(nic1.nad)
        .should('have.value', nic1.nad);
      cy.get(nicDialog.nicType).click();
      cy.get(menuItemMain)
        .eq(1)
        .click();
      cy.get(nicDialog.model).should('be.disabled');
      cy.get(modalCancel).click();
    });
  });
});
