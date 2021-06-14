import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { virtualization } from '../../view/virtualization';
import { vm } from '../../view/vm';

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
  provisionSource: ProvisionSource.CLONE_PVC,
  pvcName: 'clone-pvc-win10',
  pvcNS: testName,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

describe('Test vm creation', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.createDataVolume(winData.pvcName, winData.pvcNS);
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
  });

  [fedoraData, rhelData, winData].forEach((data) => {
    it(`creates ${data.description}`, () => {
      virtualization.vms.visit();
      vm.create(data);
    });
  });
});
