import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { ProvisionSource } from '../../utils/const/provisionSource';
import * as wizardView from '../../views/selector-wizard';
import { virtualization } from '../../views/virtualization';
import { wizard } from '../../views/wizard';

const vmData: VirtualMachineData = {
  name: `validate-nad-for-pxe-${testName}`,
  description: 'windows vm',
  namespace: testName,
  template: 'Microsoft Windows Server 2019 VM',
  provisionSource: ProvisionSource.PXE,
};

describe('Validate NAD for PXE provision source', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    virtualization.vms.visit();
  });

  after(() => {
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  it('ID(CNV-5045) Verify PXE provision source must have NAD available', () => {
    wizard.vm.open();
    wizard.vm.selectTemplate(vmData);
    cy.get(wizardView.customizeBtn).click();
    cy.get(wizardView.imageSourceDropdown).click();
    cy.contains(vmData.provisionSource.getDescription()).click({ force: true });
    cy.contains('No Network Attachment Definitions available').should('be.visible');
    cy.get(wizardView.cancelBtn).click();
    cy.on('window:confirm', () => true);
    cy.contains('button', 'Cancel').click();
  });
});
