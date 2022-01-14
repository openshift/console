import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import {
  IMPORTING,
  K8S_KIND,
  OS_IMAGES_NS,
  PREPARING_FOR_CUSTOMIZATION,
  READY_FOR_CUSTOMIZATION,
  TEMPLATE,
  TEST_PROVIDER,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { addSource } from '../../views/add-source';
import { customizeSource, PROVIDER } from '../../views/customize-source';
import { virtualization } from '../../views/virtualization';

const template = TEMPLATE.RHEL6;

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

describe('test vm template source image', () => {
  before(() => {
    cy.Login();
    cy.visit('');
    cy.createProject(testName);
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
    cy.cdiCloner(testName, OS_IMAGES_NS);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
    cy.deleteResource(K8S_KIND.Template, registryTemplate.name, testName);
    cy.deleteResource(K8S_KIND.Template, registryTemplate.name, testName);
    cy.deleteTestProject(testName);
  });

  it('customize common template source', () => {
    const vmtName = 'tmp-customized';
    cy.visitVMTemplatesList();
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS); // delete source before retry
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);

    virtualization.templates.customizeSource(template.metadataName);
    customizeSource.fillForm({ vmtName });

    cy.visitVMTemplatesList();
    virtualization.templates.testSource(vmtName, PREPARING_FOR_CUSTOMIZATION);
    virtualization.templates.testSource(vmtName, READY_FOR_CUSTOMIZATION);
    virtualization.templates.launchConsole(vmtName);
    customizeSource.finishCustomization();
    virtualization.templates.filter(vmtName);
    virtualization.templates.testSource(vmtName, PROVIDER);
    virtualization.templates.delete(vmtName);
  });

  /**
   * Should be fixed and reenabled once Virtualization merged.
   */

  xit('customize user template source', () => {
    const vmtName = 'tmp-user-customized';
    cy.visitVMTemplatesList();
    virtualization.templates.createTemplateFromWizard(registryTemplate);

    virtualization.templates.customizeSource(registryTemplate.name);
    customizeSource.fillForm({ vmtName });

    cy.visitVMTemplatesList();
    virtualization.templates.testSource(vmtName, PREPARING_FOR_CUSTOMIZATION);
    virtualization.templates.testSource(vmtName, READY_FOR_CUSTOMIZATION);
    virtualization.templates.launchConsole(vmtName);
    customizeSource.finishCustomization();
    virtualization.templates.filter(vmtName);
    virtualization.templates.testSource(vmtName, PROVIDER);
    virtualization.templates.delete(vmtName);
    virtualization.templates.delete(registryTemplate.name);
  });
});
