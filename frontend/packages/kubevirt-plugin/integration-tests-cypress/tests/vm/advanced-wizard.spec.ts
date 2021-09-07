import { testName } from '../../support';
import { Network, VirtualMachineData } from '../../types/vm';
import { K8S_KIND, NAD_NAME, TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { vm } from '../../views/vm';

const nic0: Network = {
  name: 'nic-0',
  nad: NAD_NAME,
};

const urlVM: VirtualMachineData = {
  name: `url-vm-customize-wizard-${testName}`,
  description: 'ID(CNV-869): create VM from URL',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const registryVM: VirtualMachineData = {
  name: `registry-vm-customize-wizard-${testName}`,
  description: 'ID(CNV-870): create VM from container image',
  namespace: testName,
  template: TEMPLATE.WIN10,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const pvcVM: VirtualMachineData = {
  name: `pvc-vm-customize-wizard-${testName}`,
  description: 'ID(CNV-2446): create VM from existing PVC',
  namespace: testName,
  template: TEMPLATE.FEDORA,
  provisionSource: ProvisionSource.CLONE_PVC,
  pvcName: 'clone-pvc-fedora',
  pvcNS: testName,
  sshEnable: false,
  startOnCreation: true,
};

const pxeVM: VirtualMachineData = {
  name: `pxe-vm-customize-wizard-${testName}`,
  description: 'ID(CNV-771): create VM from PXE',
  namespace: testName,
  template: TEMPLATE.FEDORA,
  provisionSource: ProvisionSource.PXE,
  sshEnable: false,
  networkInterfaces: [nic0],
  startOnCreation: false,
};

describe('Test VM creation', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.createNAD(testName);
    cy.createDataVolume(pvcVM.pvcName, pvcVM.pvcNS);
  });

  after(() => {
    [urlVM, registryVM, pvcVM].forEach((vmData) => {
      cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    });

    cy.deleteResource(K8S_KIND.NAD, NAD_NAME, testName);
    cy.deleteTestProject(testName);
  });

  [urlVM, registryVM, pvcVM].forEach((vmData) => {
    it(`Creates ${vmData.description}`, () => {
      cy.visitVMsList();
      vm.create(vmData, true);
    });
  });

  it('ID(CNV-771): create VM from PXE', () => {
    if (Cypress.env('DOWNSTREAM')) {
      cy.visitVMsList();
      vm.create(pxeVM, true);
    }
  });
});
