import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

const rhelData: VirtualMachineData = {
  name: `smoke-test-vm-rhel-${testName}`,
  description: 'rhel8 vm',
  namespace: testName,
  template: 'Red Hat Enterprise Linux 8.0+ VM',
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const fedoraData: VirtualMachineData = {
  name: `smoke-test-vm-fedora-${testName}`,
  description: 'fedora vm',
  namespace: testName,
  template: 'Fedora 32+ VM',
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const winData: VirtualMachineData = {
  name: `smoke-test-vm-windows-${testName}`,
  description: 'windows vm',
  namespace: testName,
  template: 'Microsoft Windows Server 2019 VM',
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
