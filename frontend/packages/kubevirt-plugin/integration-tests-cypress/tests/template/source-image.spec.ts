import { testName } from '../../support';
import {
  ADD_SOURCE,
  IMPORTING,
  K8S_KIND,
  OS_IMAGES_NS,
  TEMPLATE,
  TEST_PROVIDER,
  VM_STATUS,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { addSource } from '../../views/add-source';
import { virtualization } from '../../views/virtualization';

const template = TEMPLATE.RHEL8;

describe('test vm template source image', () => {
  before(() => {
    cy.visit('');
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteTestProject(testName);
  });

  beforeEach(() => {
    cy.visitVMTemplatesList();
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
    cy.deleteResource(K8S_KIND.DV, testName, 'default');
  });

  it('ID(CNV-5652) add Container image and delete', () => {
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);
    virtualization.templates.deleteSource(template.metadataName);
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });

  it('ID(CNV-5650) add URL image and delete', () => {
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.URL);
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);
    virtualization.templates.deleteSource(template.metadataName);
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });

  it('ID(CNV-5651) add PVC clone image and delete', () => {
    cy.createDataVolume(testName, 'default');
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.CLONE_PVC, {
      pvcName: testName,
      pvcNamespace: 'default',
    });
    virtualization.templates.testSource(template.name, VM_STATUS.Cloning);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);
    virtualization.templates.deleteSource(template.metadataName);
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });

  it('ID(CNV-5649) upload image and delete', () => {
    cy.exec(
      `test -f ${Cypress.env(
        'UPLOAD_IMG',
      )} || curl --fail -L ${ProvisionSource.URL.getSource()} -o ${Cypress.env('UPLOAD_IMG')}`,
      { timeout: 600000 },
    );
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.UPLOAD);
    virtualization.templates.testSource(template.name, 'Source uploading');
    virtualization.templates.testSource(template.name, TEST_PROVIDER);
    virtualization.templates.deleteSource(template.metadataName);
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });
});

describe('test vm template source image provider', () => {
  it('Vm Template list shows source provider', () => {
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.REGISTRY, undefined, 'fooProvider');
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, 'fooProvider');
    virtualization.templates.deleteSource(template.metadataName);
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });
});
