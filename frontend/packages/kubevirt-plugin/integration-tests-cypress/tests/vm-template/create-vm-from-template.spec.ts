import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { TEMPLATE } from '../../utils/const/index';
import { virtualization } from '../../views/virtualization';
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

describe('Test VM creation', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    virtualization.templates.createTemplateFromYAML();
  });

  after(() => {
    [vmData0, vmData1].forEach((data) => {
      cy.deleteResource({
        kind: 'VirtualMachine',
        metadata: {
          name: data.name,
          namespace: data.namespace,
        },
      });
      cy.deleteResource({
        kind: 'Template',
        metadata: {
          name: TEMPLATE.DEFAULT.name,
          namespace: testName,
        },
      });
    });
  });

  it('ID(CNV-4202) Create vm from default template via actions button', () => {
    vm.createFromActionsBtn(vmData0);
  });

  it('ID(CNV-4290) Create vm from template createVM button', () => {
    vm.createFromCreateVMBtn(vmData1);
  });
});
