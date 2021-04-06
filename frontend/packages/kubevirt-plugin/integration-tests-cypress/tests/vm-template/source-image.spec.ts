import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { addSource } from '../../view/add-source';
import { virtualization } from '../../view/virtualization';

const TEMPLATE = Cypress.env('TEMPLATE_NAME');

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
        name: Cypress.env('TEMPLATE_BASE_IMAGE'),
        namespace: Cypress.env('OS_IMAGES_NS'),
      },
    });
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: { name: testName, namespace: 'default' },
    });
  });

  it('ID(CNV-5652) add Container image and delete', () => {
    virtualization.templates.addSource(TEMPLATE);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(TEMPLATE, 'Importing');
    virtualization.templates.testSource(TEMPLATE, 'Available');
    virtualization.templates.deleteSource(TEMPLATE);
    virtualization.templates.testSource(TEMPLATE, 'Add source');
  });

  xit('ID(CNV-5650) add URL image and delete', () => {
    virtualization.templates.addSource(TEMPLATE);
    addSource.addBootSource(ProvisionSource.URL);
    virtualization.templates.testSource(TEMPLATE, 'Importing');
    virtualization.templates.testSource(TEMPLATE, 'Available');
    virtualization.templates.deleteSource(TEMPLATE);
    virtualization.templates.testSource(TEMPLATE, 'Add source');
  });

  it('ID(CNV-5651) add PVC clone image and delete', () => {
    cy.createDataVolume(testName, 'default');
    virtualization.templates.addSource(TEMPLATE);
    addSource.addBootSource(ProvisionSource.CLONE_PVC, {
      pvcName: testName,
      pvcNamespace: 'default',
    });
    virtualization.templates.testSource(TEMPLATE, 'Cloning');
    virtualization.templates.testSource(TEMPLATE, 'Available');
    virtualization.templates.deleteSource(TEMPLATE);
    virtualization.templates.testSource(TEMPLATE, 'Add source');
  });

  xit('ID(CNV-5649) upload image and delete', () => {
    cy.exec(
      `test -f ${Cypress.env(
        'UPLOAD_IMG',
      )} || curl --fail ${ProvisionSource.URL.getSource()} -o ${Cypress.env('UPLOAD_IMG')}`,
      { timeout: 600000 },
    );
    virtualization.templates.addSource(TEMPLATE);
    addSource.addBootSource(ProvisionSource.UPLOAD);
    virtualization.templates.testSource(TEMPLATE, 'Uploading');
    virtualization.templates.testSource(TEMPLATE, 'Available');
    virtualization.templates.deleteSource(TEMPLATE);
    virtualization.templates.testSource(TEMPLATE, 'Add source');
  });
});

describe('test vm template source image provider', () => {
  it('Vm Template list shows source provider', () => {
    virtualization.templates.addSource(TEMPLATE);
    addSource.addBootSource(ProvisionSource.REGISTRY, undefined, 'fooProvider');
    virtualization.templates.testSource(TEMPLATE, 'Importing');
    virtualization.templates.testSource(TEMPLATE, 'fooProvider');
    virtualization.templates.deleteSource(TEMPLATE);
    virtualization.templates.testSource(TEMPLATE, 'Add source');
  });
});
