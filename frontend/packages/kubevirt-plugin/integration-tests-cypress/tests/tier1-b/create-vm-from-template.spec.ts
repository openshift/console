import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, TEMPLATE } from '../../utils/const/index';
import { vm } from '../../views/vm';

const vmData0: VirtualMachineData = {
  name: `test-vm-from-action-btn-${testName}`,
  namespace: testName,
  template: TEMPLATE.DEFAULT,
  startOnCreation: true,
  sourceAvailable: true,
};

const vmData1: VirtualMachineData = {
  name: `test-vm-from-creatvm-btn-${testName}`,
  namespace: testName,
  template: TEMPLATE.DEFAULT,
  startOnCreation: true,
  sourceAvailable: true,
};

describe('Test VM creation from template page', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.createDefaultTemplate();
  });

  after(() => {
    [vmData0, vmData1].forEach((data) => {
      cy.deleteResource(K8S_KIND.VM, data.name, data.namespace);
    });
    cy.deleteResource(K8S_KIND.Template, TEMPLATE.DEFAULT.name, testName);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-4202) Create vm from default template via actions button', () => {
    vm.createFromActionsBtn(vmData0);
  });

  it('ID(CNV-4290) Create vm from template createVM button', () => {
    vm.createFromCreateVMBtn(vmData1);
  });
});
