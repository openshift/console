import { testName } from '../../support';
import { Disk, Network } from '../../types/vm';
import { K8S_KIND, NAD_NAME, TEMPLATE } from '../../utils/const/index';
import { addDisk, addNIC, deleteRow } from '../../views/dialog';
import { tab } from '../../views/tab';
import { virtualization } from '../../views/virtualization';

const nic1: Network = {
  name: 'nic-1',
  nad: 'bridge-network',
};

const disk1: Disk = {
  name: 'disk-1',
  size: '1',
};

describe('Test template resource', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.createNAD(testName);
    cy.createDefaultTemplate();
  });

  after(() => {
    cy.deleteResource(K8S_KIND.NAD, NAD_NAME, testName);
    cy.deleteResource(K8S_KIND.Template, TEMPLATE.DEFAULT.name, testName);
  });

  it('ID(CNV-1850) Add/Delete a NIC to/from a VM template', () => {
    tab.navigateToNetwork();
    addNIC(nic1);
    deleteRow(nic1.name);
  });

  it('ID(CNV-1849) Add/Delete a disk to/from a VM template', () => {
    tab.navigateToDisk();
    addDisk(disk1);
    deleteRow(disk1.name);
  });

  it('ID(CNV-7233) Delete user-created template', () => {
    virtualization.templates.delete(TEMPLATE.DEFAULT.name);
    cy.byLegacyTestID(TEMPLATE.DEFAULT.name).should('not.exist');
  });
});
