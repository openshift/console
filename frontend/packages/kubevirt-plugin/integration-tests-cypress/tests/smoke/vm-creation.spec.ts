import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { vm } from '../../views/vm';

const rhelData: VirtualMachineData = {
  name: `smoke-test-vm-rhel-${testName}`,
  description: 'rhel8 vm',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const fedoraData: VirtualMachineData = {
  name: `smoke-test-vm-fedora-${testName}`,
  description: 'fedora vm',
  namespace: testName,
  template: TEMPLATE.FEDORA,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const winData: VirtualMachineData = {
  name: `smoke-test-vm-windows-${testName}`,
  description: 'windows vm',
  namespace: testName,
  template: TEMPLATE.WIN10,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

describe('Test vm creation', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
  });

  after(() => {
    [rhelData, fedoraData, winData].forEach((data) => {
      cy.deleteResource(K8S_KIND.VM, data.name, data.namespace);
    });

    cy.deleteTestProject(testName);
  });

  [fedoraData, rhelData, winData].forEach((data) => {
    it(`creates ${data.description}`, () => {
      cy.visitVMsList();
      vm.create(data);
      vm.delete();
    });
  });
});
