import { testName } from '../../support';
import {
  IMPORTING,
  OS_IMAGES_NS,
  PREPARING_FOR_CUSTOMIZATION,
  READY_FOR_CUSTOMIZATION,
  TEMPLATE_BASE_IMAGE,
  TEMPLATE_METADATA_NAME,
  TEMPLATE_NAME,
  TEST_PROVIDER,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { addSource } from '../../views/add-source';
import { customizeSource, PROVIDER } from '../../views/customize-source';
import { virtualization } from '../../views/virtualization';

describe('test vm template source image', () => {
  before(() => {
    cy.Login();
    cy.visit('');
    cy.createProject(testName);
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: {
        name: TEMPLATE_BASE_IMAGE,
        namespace: OS_IMAGES_NS,
      },
    });
    cy.cdiCloner(testName, OS_IMAGES_NS);
  });

  after(() => {
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: {
        name: TEMPLATE_BASE_IMAGE,
        namespace: OS_IMAGES_NS,
      },
    });
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  it('customize common template source', () => {
    const vmtName = 'tmp-customized';
    virtualization.templates.visit();
    virtualization.templates.addSource(TEMPLATE_NAME);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(TEMPLATE_NAME, IMPORTING);
    virtualization.templates.testSource(TEMPLATE_NAME, TEST_PROVIDER);

    virtualization.templates.customizeSource(TEMPLATE_METADATA_NAME);
    customizeSource.fillForm({ vmtName });

    virtualization.templates.visit();
    virtualization.templates.testSource(vmtName, PREPARING_FOR_CUSTOMIZATION);
    virtualization.templates.testSource(vmtName, READY_FOR_CUSTOMIZATION);
    virtualization.templates.launchConsole(vmtName);
    customizeSource.finishCustomization();
    virtualization.templates.filter(vmtName);
    virtualization.templates.testSource(vmtName, PROVIDER);
  });

  it('customize user template source', () => {
    const vmtName = 'tmp-user-customized';
    cy.createUserTemplate(testName);
    virtualization.templates.visit();

    virtualization.templates.customizeSource(TEMPLATE_METADATA_NAME);
    customizeSource.fillForm({ vmtName });

    virtualization.templates.visit();
    virtualization.templates.testSource(vmtName, PREPARING_FOR_CUSTOMIZATION);
    virtualization.templates.testSource(vmtName, READY_FOR_CUSTOMIZATION);
    virtualization.templates.launchConsole(vmtName);
    customizeSource.finishCustomization();
    virtualization.templates.filter(vmtName);
    virtualization.templates.testSource(vmtName, PROVIDER);
  });
});
