import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { VM_ACTION } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { listViewAction } from '../../views/actions';
import { ipPopOverContent } from '../../views/selector';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

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
