import { VM_ACTION } from '../../const/index';
import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { listViewAction } from '../../view/actions';
import { ipPopOverContent } from '../../view/selector';
import { virtualization } from '../../view/virtualization';
import { vm } from '../../view/vm';

const vmData: VirtualMachineData = {
  name: `testvm-for-ipv6-${testName}`,
  description: 'fedora vm',
  namespace: testName,
  template: 'Fedora 32+ VM',
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

describe('Test multiple IP addresses are displayed for VM', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: vmData.name,
        namespace: vmData.namespace,
      },
    });
  });

  it('ID(CNV-6953) Test multiple IP addresses are displayed for VM', () => {
    if (Cypress.env('DUALSTACK')) {
      virtualization.vms.visit();
      vm.create(vmData);
      listViewAction(VM_ACTION.Start);
      cy.contains('+1 more')
        .should('be.visible')
        .click();
      cy.contains(ipPopOverContent, 'IP Addresses (2)').should('be.visible');
    }
  });
});
