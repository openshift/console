import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

// const nic0: Network = {
//   name: 'nic-0',
//   nad: 'bridge-network',
// };

const urlVM: VirtualMachineData = {
  name: `url-vm-customize-wizard-${testName}`,
  description: 'ID(CNV-869): create VM from URL',
  namespace: testName,
  template: TEMPLATE.RHEL8.name,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const registryVM: VirtualMachineData = {
  name: `registry-vm-customize-wizard-${testName}`,
  description: 'ID(CNV-870): create VM from container image',
  namespace: testName,
  template: TEMPLATE.WIN10.name,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const pvcVM: VirtualMachineData = {
  name: `pvc-vm-customize-wizard-${testName}`,
  description: 'ID(CNV-2446): create VM from existing PVC',
  namespace: testName,
  template: TEMPLATE.FEDORA.name,
  provisionSource: ProvisionSource.CLONE_PVC,
  pvcName: 'clone-pvc-fedora',
  pvcNS: testName,
  sshEnable: false,
  startOnCreation: true,
};

// const pxeVM: VirtualMachineData = {
//   name: `pxe-vm-customize-wizard-${testName}`,
//   description: 'ID(CNV-771): create VM from PXE',
//   namespace: testName,
//   template: 'Fedora 32+ VM',
//   provisionSource: ProvisionSource.PXE,
//   sshEnable: false,
//   networkInterfaces: [nic0],
// };

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
      cy.deleteResource({
        kind: 'VirtualMachine',
        metadata: {
          name: vmData.name,
          namespace: vmData.namespace,
        },
      });
    });
    cy.deleteResource({
      kind: 'NetworkAttachmentDefinition',
      metadata: {
        name: 'bridge-network',
        namespace: testName,
      },
    });
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  [urlVM, registryVM, pvcVM].forEach((vmData) => {
    it(`Creates ${vmData.description}`, () => {
      virtualization.vms.visit();
      vm.customizeCreate(vmData);
    });
  });
});
