import {
  ADD_SOURCE,
  IMPORTING,
  OS_IMAGES_NS,
  TEMPLATE_BASE_IMAGE,
  TEMPLATE_NAME,
  TEST_PROVIDER,
} from '../../const/index';
import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { addSource } from '../../view/add-source';
import { virtualization } from '../../view/virtualization';

describe('test vm template source image', () => {
  before(() => {
    cy.visit('');
    cy.createProject(testName);
  });

  beforeEach(() => {
    virtualization.templates.visit();
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: {
        name: TEMPLATE_BASE_IMAGE,
        namespace: OS_IMAGES_NS,
      },
    });
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: { name: testName, namespace: 'default' },
    });
  });

  it('ID(CNV-5652) add Container image and delete', () => {
    virtualization.templates.addSource(TEMPLATE_NAME);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(TEMPLATE_NAME, IMPORTING);
    virtualization.templates.testSource(TEMPLATE_NAME, TEST_PROVIDER);
    virtualization.templates.deleteSource(TEMPLATE_NAME);
    virtualization.templates.testSource(TEMPLATE_NAME, ADD_SOURCE);
  });

  xit('ID(CNV-5650) add URL image and delete', () => {
    virtualization.templates.addSource(TEMPLATE_NAME);
    addSource.addBootSource(ProvisionSource.URL);
    virtualization.templates.testSource(TEMPLATE_NAME, IMPORTING);
    virtualization.templates.testSource(TEMPLATE_NAME, TEST_PROVIDER);
    virtualization.templates.deleteSource(TEMPLATE_NAME);
    virtualization.templates.testSource(TEMPLATE_NAME, ADD_SOURCE);
  });

  it('ID(CNV-5651) add PVC clone image and delete', () => {
    cy.createDataVolume(testName, 'default');
    virtualization.templates.addSource(TEMPLATE_NAME);
    addSource.addBootSource(ProvisionSource.CLONE_PVC, {
      pvcName: testName,
      pvcNamespace: 'default',
    });
    virtualization.templates.testSource(TEMPLATE_NAME, 'Cloning');
    virtualization.templates.testSource(TEMPLATE_NAME, TEST_PROVIDER);
    virtualization.templates.deleteSource(TEMPLATE_NAME);
    virtualization.templates.testSource(TEMPLATE_NAME, ADD_SOURCE);
  });

  xit('ID(CNV-5649) upload image and delete', () => {
    cy.exec(
      `test -f ${Cypress.env(
        'UPLOAD_IMG',
      )} || curl --fail -L ${ProvisionSource.URL.getSource()} -o ${Cypress.env('UPLOAD_IMG')}`,
      { timeout: 600000 },
    );
    virtualization.templates.addSource(TEMPLATE_NAME);
    addSource.addBootSource(ProvisionSource.UPLOAD);
    virtualization.templates.testSource(TEMPLATE_NAME, 'Uploading');
    virtualization.templates.testSource(TEMPLATE_NAME, TEST_PROVIDER);
    virtualization.templates.deleteSource(TEMPLATE_NAME);
    virtualization.templates.testSource(TEMPLATE_NAME, ADD_SOURCE);
  });
});

describe('test vm template source image provider', () => {
  it('Vm Template list shows source provider', () => {
    virtualization.templates.addSource(TEMPLATE_NAME);
    addSource.addBootSource(ProvisionSource.REGISTRY, undefined, 'fooProvider');
    virtualization.templates.testSource(TEMPLATE_NAME, IMPORTING);
    virtualization.templates.testSource(TEMPLATE_NAME, 'fooProvider');
    virtualization.templates.deleteSource(TEMPLATE_NAME);
    virtualization.templates.testSource(TEMPLATE_NAME, ADD_SOURCE);
  });
});
