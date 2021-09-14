import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

const rhelData: VirtualMachineData = {
  name: `smoke-test-vm-rhel-${testName}`,
  description: 'rhel8 vm',
  namespace: testName,
  template: TEMPLATE.RHEL8.name,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const fedoraData: VirtualMachineData = {
  name: `smoke-test-vm-fedora-${testName}`,
  description: 'fedora vm',
  namespace: testName,
  template: TEMPLATE.FEDORA.name,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const winData: VirtualMachineData = {
  name: `smoke-test-vm-windows-${testName}`,
  description: 'windows vm',
  namespace: testName,
  template: TEMPLATE.WIN10.name,
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
      cy.deleteResource({
        kind: 'VirtualMachine',
        metadata: {
          name: data.name,
          namespace: data.namespace,
        },
      });
    });
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  [fedoraData, rhelData, winData].forEach((data) => {
    it(`creates ${data.description}`, () => {
      virtualization.vms.visit();
      vm.create(data);
    });
  });
});
