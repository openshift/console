import { testName } from '../../support';
import { Network, Template, VirtualMachineData } from '../../types/vm';
import { TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

const nic0: Network = {
  name: 'nic-1',
  nad: 'bridge-network',
};

const urlTemplate: VirtualMachineData = {
  name: `url-template-${testName}`,
  description: 'ID(CNV-1503): create template from URL',
  namespace: testName,
  templateProvider: 'foo',
  templateSupport: true,
  os: TEMPLATE.RHEL8.os,
  template: TEMPLATE.RHEL8,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
};

const registryTemplate: VirtualMachineData = {
  name: `registry-template-${testName}`,
  description: 'ID(CNV-871): create template from registry',
  namespace: testName,
  templateProvider: 'foo',
  templateSupport: true,
  os: TEMPLATE.WIN2K12R2.os,
  template: TEMPLATE.WIN2K12R2,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
};

const pvcTemplate: VirtualMachineData = {
  name: `pvc-template-${testName}`,
  description: 'ID(CNV-4095): create template from existing PVC',
  namespace: testName,
  templateProvider: 'foo',
  templateSupport: true,
  template: TEMPLATE.FEDORA,
  os: TEMPLATE.FEDORA.os,
  provisionSource: ProvisionSource.CLONE_PVC,
  pvcName: 'clone-pvc-fedora',
  pvcNS: testName,
};

const pxeTemplate: VirtualMachineData = {
  name: `pxe-template-${testName}`,
  description: 'ID(CNV-4094): create template from PXE',
  namespace: testName,
  templateProvider: 'foo',
  templateSupport: true,
  os: TEMPLATE.FEDORA.os,
  template: TEMPLATE.FEDORA,
  provisionSource: ProvisionSource.PXE,
  networkInterfaces: [nic0],
};

describe('Test VM creation', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.createNAD(testName);
    cy.createDataVolume(pvcTemplate.pvcName, pvcTemplate.pvcNS);
  });

  after(() => {
    [urlTemplate, registryTemplate, pvcTemplate, pxeTemplate].forEach((data) => {
      cy.deleteResource({
        kind: 'Template',
        metadata: {
          name: data.name,
          namespace: data.namespace,
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
  });

  [urlTemplate, registryTemplate, pvcTemplate, pxeTemplate].forEach((data) => {
    it(`${data.description}`, () => {
      virtualization.templates.visit();
      virtualization.templates.createTemplateFromWizard(data);
      const vmt: Template = { name: data.name };
      const vmData: VirtualMachineData = {
        name: `vm-from-${data.name}`,
        template: vmt,
        sourceAvailable: true,
      };
      virtualization.vms.visit();
      vm.create(vmData);
      vm.delete();
    });
  });
});
