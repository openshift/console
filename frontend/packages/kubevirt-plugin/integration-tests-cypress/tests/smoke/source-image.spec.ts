import { testName } from '../../support';
import {
  ADD_SOURCE,
  IMPORTING,
  K8S_KIND,
  OS_IMAGES_NS,
  TEMPLATE,
  TEST_PROVIDER,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { addSource } from '../../views/add-source';
import { virtualization } from '../../views/virtualization';

const template = TEMPLATE.RHEL7;

describe('test VM template source image', () => {
  before(() => {
    cy.Login();
    cy.visit('');
    cy.createProject(testName);
    cy.visitVMTemplatesList();
    virtualization.templates.filter(template.metadataName);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
    cy.deleteTestProject(testName);
  });

  beforeEach(() => {
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
    cy.deleteResource(K8S_KIND.DV, testName, 'default');
  });

  it('ID(CNV-5652) add Container image and delete', () => {
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);
    virtualization.templates.deleteSource(TEST_PROVIDER);
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });

  it('ID(CNV-5650) add URL image and delete', () => {
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.URL);
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);
    virtualization.templates.deleteSource(TEST_PROVIDER);
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });

  it('ID(CNV-5651) add PVC clone image and delete', () => {
    cy.createDataVolume(testName, 'default');
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.CLONE_PVC, {
      pvcName: testName,
      pvcNamespace: 'default',
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);
    virtualization.templates.deleteSource(TEST_PROVIDER);
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });

  it('ID(CNV-5649) upload image and delete', () => {
    if (Cypress.env('DOWNSTREAM')) {
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
      virtualization.templates.deleteSource(TEST_PROVIDER);
      virtualization.templates.testSource(template.name, ADD_SOURCE);
    }
  });

  it('test template source image provider', () => {
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.REGISTRY, undefined, 'fooProvider');
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, 'fooProvider');
    virtualization.templates.deleteSource('fooProvider');
    virtualization.templates.testSource(template.name, ADD_SOURCE);
  });
});
